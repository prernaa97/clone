import mongoose from "mongoose";
import crypto from "crypto";
import Subscription from "../models/Subscription.js";
import Plan from "../models/plan.js";
import Payment from "../models/paymant.js";
import Role from "../models/roles.js";
import UserRole from "../models/userRoles.js";
import Clinic from "../models/clinic.js";
import Slot from "../models/Slot.js";

// Middleware 1: Prepare renewal (validate inputs, confirm replace if active)
export const prepareRenewal = async (req, res, next) => {
  try {
    const { doctorId, planId, confirmReplace } = req.body;
    if (!doctorId || !planId) {
      return res.status(400).json({ success: false, message: "doctorId and planId are required" });
    }

    // Optional: ensure logged-in user matches doctorId
    const currentUserId = req.user?.id || req.user?._id?.toString();
    if (currentUserId && String(currentUserId) !== String(doctorId)) {
      return res.status(403).json({ success: false, message: "Forbidden: mismatched user" });
    }

    // Validate plan
    const plan = await Plan.findById(planId);
    if (!plan || plan.isActive === false) {
      return res.status(404).json({ success: false, message: "Plan not found or inactive" });
    }

    // Check existing active subscription
    const now = new Date();
    const activeSub = await Subscription.findOne({ doctorId, isActive: true, endDate: { $gte: now } });

    // Always require explicit confirmation, even if there is no active sub (expired case)
    const confirmed = isConfirmed(confirmReplace);
    if (!confirmed) {
      const message = activeSub
        ? "Current subscription is active. Confirm to replace (will deactivate current plan)."
        : "No active subscription found. Confirm to start a new subscription plan.";
      return res.status(409).json({ success: false, needsConfirmation: true, message });
    }

    req.renewalContext = { doctorId, plan, activeSub };
    return next();
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

function isConfirmed(v) {
  if (v === true) return true;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "true" || s === "1" || s === "yes" || s === "y";
  }
  if (typeof v === "number") return v === 1;
  return false;
}

// Middleware 2: Finalize renewal (verify payment, activate new subscription, generate slots)
export const finalizeRenewal = async (req, res) => {
  //signature id = c446dabc99ca7e779fff79f2b436aa6abf8b5dc289e82aab553d6dadfcf6006a paymentId = pay_RCgDK0bJo0jP34
    //   const { razorpay_order_id , razorpay_payment_id } = req.body;
    //   const body = `${String(razorpay_order_id).trim()}|${String(razorpay_payment_id).trim()}`;
    // const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(body).digest("hex");
    // console.log("RAZORPAY_KEY_SECRET: ",expected);

  const session = await mongoose.startSession();
  let didCommit = false;
  try {
    const { doctorId, plan, activeSub } = req.renewalContext || {};
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!doctorId || !plan) {
      return res.status(400).json({ success: false, message: "Renewal context missing" });
    }
    // if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    //   return res.status(400).json({ success: false, message: "Missing payment verification fields" });
    // }

    // Verify Razorpay signature
    const body = `${String(razorpay_order_id).trim()}|${String(razorpay_payment_id).trim()}`;
    const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(body).digest("hex");
    console.log("RAZORPAY_KEY_SECRET: ",expected);
    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    await session.startTransaction();

    // Deactivate existing active subscription if replacing
    if (activeSub) {
      activeSub.isActive = false;
      activeSub.endDate = new Date();
      await activeSub.save({ session });
    }

    // Create new subscription (inactive until payment recorded)
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Number(plan.days || 0));
    const [newSub] = await Subscription.create([
      { doctorId, planId: plan._id, startDate, endDate, isActive: false, postsUsed: 0 }
    ], { session });

    // Payment record
    await Payment.create([
      {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        amount: plan.price,
        sub_id: newSub._id,
        status: "paid",
        currency: "INR"
      }
    ], { session });

    // Activate new subscription
    newSub.isActive = true;
    newSub.paymentId = razorpay_payment_id;
    await newSub.save({ session });

    // Ensure Doctor role mapping
    const userId = doctorId;
    let doctorRole = await Role.findOne({ name: "Doctor" }).session(session);
    if (!doctorRole) {
      doctorRole = await Role.create([{ name: "Doctor" }], { session }).then(r => r[0]);
    }
    const userRole = await Role.findOne({ name: "User" }).session(session);
    if (userRole) {
      await UserRole.deleteMany({ userId, roleId: userRole._id }).session(session);
    }
    await UserRole.updateOne(
      { userId, roleId: doctorRole._id },
      { $setOnInsert: { userId, roleId: doctorRole._id } },
      { upsert: true, session }
    );

    await session.commitTransaction();
    didCommit = true;
    session.endSession();

    // AFTER COMMIT: Generate slots for all clinics until subscription end (outside transaction)
    const clinics = await Clinic.find({ doctorId });
    const generationResults = [];
    for (const clinic of clinics) {
      const { clinicTiming } = clinic;
      if (!clinicTiming || !clinicTiming.days || !clinicTiming.startTime || !clinicTiming.endTime || !clinicTiming.slotDuration) {
        continue;
      }
      const slots = buildSlotsForClinic(clinic, newSub.endDate);
      if (slots.length > 0) {
        try {
          await Slot.insertMany(slots, { ordered: false });
          generationResults.push({ clinicId: clinic._id, slotsCreated: slots.length });
        } catch (e) {
          const inserted = e?.result?.result?.nInserted || e?.insertedDocs?.length || 0;
          generationResults.push({ clinicId: clinic._id, slotsCreated: inserted, note: "duplicates skipped" });
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Subscription renewed and slots generated",
      subscription: newSub,
      slotSummary: generationResults
    });
  } catch (err) {
    try {
      if (!didCommit && typeof session.inTransaction === "function" && session.inTransaction()) {
        await session.abortTransaction();
      }
    } catch (_) {}
    session.endSession();
    return res.status(500).json({ success: false, message: err.message });
  }
};

function parseTimeToMinutes(hhmmAmPm) {
  const m = /^([0-1]?\d|2[0-3]):([0-5]\d)\s*(AM|PM)$/i.exec(String(hhmmAmPm).trim());
  if (!m) return null;
  let hours = parseInt(m[1], 10);
  const minutes = parseInt(m[2], 10);
  const meridiem = m[3].toUpperCase();
  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function buildSlotsForClinic(clinic, endDate) {
  const result = [];
  const { clinicTiming } = clinic;
  const startMinutes = parseTimeToMinutes(clinicTiming.startTime);
  const endMinutes = parseTimeToMinutes(clinicTiming.endTime);
  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) return result;
  const dayNameToNumber = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
  const workingDaysNumbers = clinicTiming.days.map(d => dayNameToNumber[d]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const generationEnd = new Date(endDate);
  generationEnd.setHours(23, 59, 59, 999);

  for (let date = new Date(today); date <= generationEnd; date.setDate(date.getDate() + 1)) {
    if (!workingDaysNumbers.includes(date.getDay())) continue;
    const dayStart = new Date(date);
    dayStart.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);

    let cursor = new Date(dayStart);
    while (cursor < dayEnd) {
      const slotEnd = new Date(cursor.getTime() + clinicTiming.slotDuration * 60000);
      if (slotEnd > dayEnd) break;
      result.push({
        doctorId: clinic.doctorId,
        clinicId: clinic._id,
        start: new Date(cursor),
        end: slotEnd,
        availability: "available"
      });
      cursor = slotEnd;
    }
  }
  return result;
}


