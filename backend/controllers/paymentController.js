import crypto from "crypto";
import mongoose from "mongoose";
import { razorpay } from "../config/razorpay.js";
import Payment from "../models/paymant.js";
import Subscription from "../models/Subscription.js";
import Plan from "../models/plan.js";
import DoctorProfile from "../models/doctorProfile.js";
import Role from "../models/roles.js";
import UserRole from "../models/userRoles.js";

export const checkout = async (req, res) => {
  try {
    const { amount, currency = "INR" } = req.body;
    const parsedAmount = Number(amount);
    console.log("Amount received:", amount, typeof amount);

    if (typeof parsedAmount !== "number" || parsedAmount <= 0) {
   return res.status(400).json({ success: false, message: "amount must be a positive number" });
  }
    // Razorpay ka orders.create() call hota hai, jisme: amount paise me dena padta hai (1 INR rupee= 100 paise).
    // Isiliye Math.round(amount * 100) kiya gaya hai. Agar tum 500 bhejte ho to ye 50000 ban jayega (Razorpay ko paise me dena compulsory hai).
    // currency INR ya USD etc.
    const order = await razorpay.orders.create({
      amount: Math.round(parsedAmount * 100), //(500rs * 100) = 50000 paise
      currency
    });
    return res.status(200).json({ success: true, order });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, sub_id }
export const paymentVerification = async (req, res) => {
  const session = await mongoose.startSession();
  //User jab pay karega (card/UPI/netbanking se), Razorpay 2 values return karega:
  //razorpay_payment_id → ek unique ID (jaise pay_LkXyz123) , razorpay_signature
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, sub_id } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !sub_id) {
      return res.status(400).json({ success: false, message: "Missing required payment fields" });
    }

    // const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const body = `${razorpay_order_id.trim()}|${razorpay_payment_id.trim()}`;
    console.log("Body:", body);

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    console.log("Expected Signature:", expected);

    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }
    console.log("Received Signature:", razorpay_signature);

    await session.startTransaction();

    const subscription = await Subscription.findById(sub_id).session(session);
    if (!subscription) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }
    if (subscription.isActive) {
      await session.abortTransaction();
      return res.status(409).json({ success: false, message: "Subscription already active" });
    }

    // Create payment record
    await Payment.create(
      [{
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        amount,
        sub_id,
        status: "paid",
        currency: "INR"
      }],
      { session }
    );

    // Activate subscription with dates from plan
    const plan = await Plan.findById(subscription.planId).session(session);
    if (!plan || plan.isActive === false) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Plan not found or inactive" });
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Number(plan.days || 0));

    subscription.paymentId = razorpay_payment_id;
    subscription.startDate = startDate;
    subscription.endDate = endDate;
    subscription.isActive = true;
    await subscription.save({ session });

    // Assign Doctor role to this user (doctorId equals userId)
    const userId = subscription.doctorId;
    if (userId) {
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
    }

    await session.commitTransaction();
    const doctorProfile = await DoctorProfile.findOne({ userId: subscription.doctorId });
    return res.status(200).json({
      success: true,
      data: {
        profile: doctorProfile,
        subscription,
        plan,
        payment: await Payment.findOne({ sub_id: subscription._id })
      }
    });
  } catch (err) {
    await session.abortTransaction();
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};