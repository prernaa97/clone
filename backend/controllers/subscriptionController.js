import Subscription from "../models/Subscription.js";
import Plan from "../models/Plan.js";
import Doctor from "../models/doctor.js";

// Create Subscription (Doctor chooses a plan)
export const createSubscription = async (req, res) => {
  try {
        console.log(request.body);
        let { email } = request.body;

    //const { doctorId, planId, paymentId } = req.body;
    let doctor = await Doctor.findOne({ where: { email } });
    console.log(professional);
    if (!doctor) doctor = await Doctor.create(request.body);

        let subscription = await Subscription.findOne({
      where: {
        doctorId : doctor._Id,
        subscription_active: 1,
      },
    });
    console.log("subscription", subscription);


    const plan = await Plan.findById(planId);
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.durationInDays);

    const subscription = new Subscription({
      doctorId,
      planId,
      startDate,
      endDate,
      isActive: true,
      paymentId,
    });

    await subscription.save();
    res.status(201).json({ success: true, message: "Subscription created", subscription });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error creating subscription", error: error.message });
  }
};

// Get All Subscriptions (Admin use case)
export const getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find().populate("doctorId planId");
    res.status(200).json({ success: true, subscriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching subscriptions", error: error.message });
  }
};

// Get Subscription by Doctor
export const getDoctorSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ doctorId: req.params.doctorId }).populate("planId");
    if (!subscription) return res.status(404).json({ success: false, message: "Subscription not found" });
    res.status(200).json({ success: true, subscription });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching subscription", error: error.message });
  }
};

// Update Subscription (extend/change plan)
export const updateSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!subscription) return res.status(404).json({ success: false, message: "Subscription not found" });
    res.status(200).json({ success: true, message: "Subscription updated", subscription });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating subscription", error: error.message });
  }
};

// Delete Subscription (Cancel)
export const deleteSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findByIdAndDelete(req.params.id);
    if (!subscription) return res.status(404).json({ success: false, message: "Subscription not found" });
    res.status(200).json({ success: true, message: "Subscription cancelled" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error cancelling subscription", error: error.message });
  }
};
