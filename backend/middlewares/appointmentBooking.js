import mongoose from "mongoose";
import Slot from "../models/Slot.js";
import Clinic from "../models/clinic.js";
import Appointment from "../models/Appointment.js";
import crypto from "crypto";

// Prepare booking: validate slot, availability, fee, and conflict for the user
export const prepareAppointment = async (req, res, next) => {
  try {
    const { slotId, confirmOverride } = req.body;
    const currentUserId = req.user?.id || req.user?._id?.toString() || req.body.userId; // fallback to body for now
    //console.log("currentUserId: ",currentUserId);
    if (!currentUserId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!mongoose.Types.ObjectId.isValid(slotId)) return res.status(400).json({ success: false, message: "Invalid slotId" });

    const slot = await Slot.findById(slotId);
    if (!slot) return res.status(404).json({ success: false, message: "Slot not found" });
    if (slot.availability !== "available") {
      return res.status(409).json({ success: false, message: "Slot not available" });
    }

    const clinic = await Clinic.findById(slot.clinicId);
    if (!clinic) return res.status(404).json({ success: false, message: "Clinic not found for slot" });
    const fee = clinic.consultationFee;x``

    // Conflict check: does user already have appointment overlapping same time elsewhere?
    const overlapping = await Appointment.find({ userId: currentUserId })
      .populate({ path: "slotId", select: "start end clinicId" });

    let hasConflict = false;
    let conflictWith = null;
    for (const appt of overlapping) {
      const s = appt.slotId;
      if (!s) continue;
      const overlap = !(new Date(s.end) <= new Date(slot.start) || new Date(s.start) >= new Date(slot.end));
      if (overlap && String(s.clinicId) !== String(slot.clinicId)) {
        hasConflict = true;
        conflictWith = { otherClinicId: s.clinicId, existingSlotId: s._id, at: s.start };
        break;
      }
    }

    if (hasConflict && !isConfirmed(confirmOverride)) {
      return res.status(409).json({
        success: false,
        needsConfirmation: true,
        message: "You already have an appointment at this time in another clinic. Confirm to book anyway.",
        conflict: conflictWith,
        fee
      });
    }

    req.appointmentContext = {
      userId: currentUserId,
      slot,
      clinic,
      fee,
      confirmOverride: !!isConfirmed(confirmOverride)
    };

    if (typeof next === "function") return next();
    return res.status(200).json({ success: true, ready: true, fee });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Finalize booking: verify payment then atomically book slot and create appointment
export const finalizeAppointment = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { userId, slot, fee } = req.appointmentContext || {};
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, type = "virtual" } = req.body;
    console.log("userId: ",req.appointmentContext.userId);
    console.log("slotId: ",req.appointmentContext.slot);

    if (!userId || !slot) {
      return res.status(400).json({ success: false, message: "Preparation missing" });
    }
    // if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    //   return res.status(400).json({ success: false, message: "Missing payment verification fields" });
    // }

    const body = `${String(razorpay_order_id).trim()}|${String(razorpay_payment_id).trim()}`;
    const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(body).digest("hex");
    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    await session.startTransaction();

    // Try to book slot atomically only if still available
    const updatedSlot = await Slot.findOneAndUpdate(
      { _id: slot._id, availability: "available" },
      { $set: { availability: "booked" } },
      { new: true, session }
    );
    if (!updatedSlot) {
      await session.abortTransaction();
      return res.status(409).json({ success: false, message: "Slot not available" });
    }

    const [appointment] = await Appointment.create([
      {
        slotId: updatedSlot._id,
        doctorId: updatedSlot.doctorId,
        userId,
        type,
        status: "confirmed",
        paymentId: razorpay_payment_id,
        paymentStatus: "paid",
        bookedAt: new Date()
      }
    ], { session });

    await session.commitTransaction();
    session.endSession();
    return res.status(201).json({ success: true, data: appointment });
  } catch (err) {
    try { await session.abortTransaction(); } catch (e) {}
    session.endSession();
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


