import Plan from "../models/plan.js";

// Create Plan (Admin Only)
export const createPlan = async (req, res) => {
  try {
    const id = req.query.id;
    if (id) {
      const updated = await Plan.findByIdAndUpdate(id, req.body, { new: true });
      if (!updated) return res.status(404).json({ success: false, message: "Plan not found" });
      return res.status(200).json({ success: true, message: "Plan updated", plan: updated });
    }
    const plan = new Plan(req.body);
    await plan.save();
    return res.status(201).json({ success: true, message: "Plan created", plan });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error managing plan", error: error.message });
  }
};

// Get All Plans
export const getAllPlans = async (req, res) => {
  try {
    const plans = await Plan.find();
    res.status(200).json({ success: true, plans });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching plans", error: error.message });
  }
};

// Get Plan by ID
export const getPlanById = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });
    res.status(200).json({ success: true, plan });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching plan", error: error.message });
  }
};

// Update Plan
export const updatePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });
    res.status(200).json({ success: true, message: "Plan updated", plan });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating plan", error: error.message });
  }
};

// Delete Plan
export const deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });
    res.status(200).json({ success: true, message: "Plan deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting plan", error: error.message });
  }
};
