import mongoose from "mongoose";
import Subscription from "../models/Subscription.js";
import Plan from "../models/plan.js";
import Payment from "../models/paymant.js";
import DoctorProfile from "../models/doctorProfile.js";

// POST /api/subscription
// Body: { doctorId, planId, payment: { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } }
// Body: { doctorId, planId }
export const createSubscription = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { doctorId, planId } = req.body;
    if (!doctorId || !planId) {
      return res.status(400).json({ success: false, message: "doctorId and planId are required" });
    }

    // Profile must be Approved (doctorId equals userId)
    const profile = await DoctorProfile.findOne({ userId: doctorId });
    if (!profile) return res.status(404).json({ success: false, message: "Doctor profile not found" });
    if (profile.status !== "Approved") {
      return res.status(403).json({ success: false, message: "Doctor profile is not approved" });
    }

    await session.startTransaction();

    const plan = await Plan.findById(planId).session(session);
    if (!plan || plan.isActive === false) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Plan not found or inactive" });
    }

    const now = new Date();
    const existing = await Subscription.findOne({
      doctorId, isActive: true, endDate: { $gte: now }
    }).session(session);

    if (existing) {
      await session.abortTransaction();
      return res.status(409).json({ success: false, message: "Active subscription already exists" });
    }

    const [subscription] = await Subscription.create(
      [{ doctorId, planId, isActive: false, postsUsed: 0 }],
      { session }
    );

    await session.commitTransaction();
    return res.status(201).json({
      success: true,
      message: "Subscription created, proceed to payment",
      subscription
    });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

//  Get All Doctors
export const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find();
    res.status(200).json({ success: true, count: doctors.length, data: doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get Doctor by ID
export const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    res.status(200).json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update Doctor
export const updateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    res.status(200).json({ success: true, message: "Doctor updated", data: doctor });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ✅ Delete Doctor
export const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    res.status(200).json({ success: true, message: "Doctor deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
