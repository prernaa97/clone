import Slot from "../models/Slot.js";
import Clinic from "../models/clinic.js";
import mongoose from "mongoose";
/**
 * Create one or multiple slots.
 * Body example for single slot:
 * { doctorId, start: "2025-08-30T10:00:00.000Z", end: "2025-08-30T10:15:00.000Z" }
 */
// export const createSlot = async (req, res) => {
//   try {
//     const slot = new Slot(req.body);
//     await slot.save();
//     return res.status(201).json({ success: true, data: slot });
//   } catch (err) {
//     // duplicate key (unique index) -> 409
//     if (err.code === 11000) {
//       return res.status(409).json({ success: false, message: "Slot already exists" });
//     }
//     return res.status(400).json({ success: false, message: err.message });
//   }
// };

export const createClinicWithSlots = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { doctorId, clinicName, clinicAddress, city, consultationFee, clinicTiming } = req.body;
    console.log(req.body);
    // 1 Create Clinic
    const clinic = await Clinic.create([{
      doctorId,
      clinicName,
      clinicAddress,
      city,
      consultationFee,
      clinicTiming
    }], { session });

    const clinicId = clinic[0]._id;
    console.log("recent created clinic: ", clinicId);

    // 2 Generate Slots
    const slots = [];
    const dayMap = {
      Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
      Thursday: 4, Friday: 5, Saturday: 6
    };
    const workingDaysNumbers = clinicTiming.days.map(d => dayMap[d]);
    const daysAhead = 30; // generate slots for next 30 days

    for (let i = 0; i < daysAhead; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      if (!workingDaysNumbers.includes(date.getDay())) continue;

      let start = new Date(`${date.toDateString()} ${clinicTiming.startTime}`);
      const end = new Date(`${date.toDateString()} ${clinicTiming.endTime}`);
      while (start < end) {
        const slotEnd = new Date(start.getTime() + clinicTiming.slotDuration * 60000);
        if (slotEnd > end) break;

        slots.push({
          doctorId,
          clinicId,
          start,
          end,
          availability: "available"
        });

        start = slotEnd;
      }
    }

    // 3 Insert slots
    if (slots.length > 0) {
      await Slot.insertMany(slots, { session, ordered: false });
    }

    // 4️ Commit transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ success: true, clinic: clinic[0], slotsCreated: slots.length });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ success: false, message: err.message });
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
