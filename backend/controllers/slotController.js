import Slot from "../models/Slot.js";

/**
 * Create one or multiple slots.
 * Body example for single slot:
 * { doctorId, start: "2025-08-30T10:00:00.000Z", end: "2025-08-30T10:15:00.000Z" }
 */
export const createSlot = async (req, res) => {
  try {
    const slot = new Slot(req.body);
    await slot.save();
    return res.status(201).json({ success: true, data: slot });
  } catch (err) {
    // duplicate key (unique index) -> 409
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "Slot already exists" });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
};

// create many slots (bulk) - optional
export const createManySlots = async (req, res) => {
  try {
    const slots = await Slot.insertMany(req.body.slots, { ordered: false });
    return res.status(201).json({ success: true, data: slots });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// Get slots for a doctor (optional query params: from, to, availability)
export const getSlotsByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { from, to, availability } = req.query;

    const q = { doctorId };
    if (availability) q.availability = availability;
    if (from || to) q.start = {};
    if (from) q.start.$gte = new Date(from);
    if (to) q.start.$lte = new Date(to);

    const slots = await Slot.find(q).sort({ start: 1 });
    return res.status(200).json({ success: true, data: slots });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getSlotById = async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id);
    if (!slot) return res.status(404).json({ success: false, message: "Slot not found" });
    return res.status(200).json({ success: true, data: slot });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateSlot = async (req, res) => {
  try {
    const slot = await Slot.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!slot) return res.status(404).json({ success: false, message: "Slot not found" });
    return res.status(200).json({ success: true, data: slot });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteSlot = async (req, res) => {
  try {
    const slot = await Slot.findByIdAndDelete(req.params.id);
    if (!slot) return res.status(404).json({ success: false, message: "Slot not found" });
    return res.status(200).json({ success: true, message: "Slot deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
