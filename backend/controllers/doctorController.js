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
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + plan.days); //  plan duration
    const [subscription] = await Subscription.create(
      [{ doctorId, planId, isActive: false, postsUsed: 0 ,startDate, endDate}],
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
// export const getAllDoctors = async (req, res) => {
//   try {
//     const doctors = await DoctorProfile.find();
//     res.status(200).json({ success: true, count: doctors.length, data: doctors });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

export const getAllDoctors = async (req, res) => {
  try {
    const doctors = await DoctorProfile.aggregate([
      {
        $lookup: {
          from: "clinics",            // Clinic collection ka naam
          localField: "_id",          // DoctorProfile._id
          foreignField: "doctorId",   // Clinic.doctorId
          as: "clinics"               // response me "clinics" naam se array add hoga
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get Approved Doctors with Pagination
export const getApprovedDoctors = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    // Convert page and limit to numbers
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get approved doctors with active subscriptions
    const approvedDoctors = await DoctorProfile.find({ 
      status: "Approved" 
    })
    .skip(skip)
    .limit(limitNum)
    .sort({ createdAt: -1 });

    // Get total count for pagination
    const total = await DoctorProfile.countDocuments({ status: "Approved" });

    return res.status(200).json({ 
      success: true, 
      data: approvedDoctors,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Get Doctor by ID
export const getDoctorById = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    res.status(200).json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Login helper: subscription status for renewal prompt
export const getSubscriptionStatus = async (req, res) => {
  try {
    const { doctorId } = req.query;
    if (!doctorId) return res.status(400).json({ success: false, message: "doctorId is required" });

    const now = new Date();
    const subs = await Subscription.find({ doctorId }).sort({ endDate: -1 }).limit(1);
    if (!subs || subs.length === 0) {
      return res.status(200).json({ success: true, hasActive: false, needsRenewal: true });
    }
    const s = subs[0];
    const hasActive = s.isActive && s.endDate >= now;
    const daysLeft = Math.ceil((new Date(s.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return res.status(200).json({
      success: true,
      hasActive,
      needsRenewal: !hasActive,
      endDate: s.endDate,
      daysLeft: hasActive ? Math.max(daysLeft, 0) : 0
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update Doctor
export const updateDoctor = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findByIdAndUpdate(req.params.id, req.body, {
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
    const doctor = await DoctorProfile.findByIdAndDelete(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    res.status(200).json({ success: true, message: "Doctor deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all subscriptions for a doctor
export const getSubscriptionsByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    if (!doctorId) {
      return res.status(400).json({ success: false, message: "doctorId is required" });
    }

    const subscriptions = await Subscription.find({ doctorId })
      .populate('planId', 'name price days postLimit discount')
      .sort({ createdAt: -1 });

    const formattedSubscriptions = subscriptions.map(sub => ({
      _id: sub._id,
      planName: sub.planId?.name || 'Unknown Plan',
      planDays: sub.planId?.days || 0,
      planPrice: sub.planId?.price || 0,
      startDate: sub.startDate,
      endDate: sub.endDate,
      isActive: sub.isActive,
      postsUsed: sub.postsUsed,
      paymentId: sub.paymentId,
      createdAt: sub.createdAt
    }));

    res.status(200).json({ 
      success: true, 
      subscriptions: formattedSubscriptions 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get enhanced subscription status with current plan details
export const getEnhancedSubscriptionStatus = async (req, res) => {
  try {
    const { doctorId } = req.query;
    if (!doctorId) return res.status(400).json({ success: false, message: "doctorId is required" });

    const now = new Date();
    
    // Get current active subscription
    const activeSubscription = await Subscription.findOne({
      doctorId,
      isActive: true,
      endDate: { $gte: now }
    }).populate('planId', 'name price days postLimit discount');

    if (!activeSubscription) {
      return res.status(200).json({ 
        success: true, 
        hasActive: false, 
        needsRenewal: true 
      });
    }

    const daysLeft = Math.ceil((new Date(activeSubscription.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return res.status(200).json({
      success: true,
      hasActive: true,
      needsRenewal: false,
      startDate: activeSubscription.startDate,
      endDate: activeSubscription.endDate,
      daysLeft: Math.max(daysLeft, 0),
      postsUsed: activeSubscription.postsUsed,
      currentPlan: {
        _id: activeSubscription.planId._id,
        name: activeSubscription.planId.name,
        price: activeSubscription.planId.price,
        days: activeSubscription.planId.days,
        postLimit: activeSubscription.planId.postLimit,
        discount: activeSubscription.planId.discount
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};