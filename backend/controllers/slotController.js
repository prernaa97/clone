import Slot from "../models/Slot.js";
import Clinic from "../models/clinic.js";
import mongoose from "mongoose";
import Subscription from "../models/Subscription.js";
import DoctorProfile from "../models/doctorProfile.js";
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

    const { doctorId, clinicName, clinicAddress, city, consultationFee, clinicTiming, generateDays } = req.body;
    if (!doctorId || !clinicName || !clinicAddress || !city || !consultationFee || !clinicTiming) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "All required fields must be provided" });
    }
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid doctorId" });
    }
    if (typeof consultationFee !== "number" || consultationFee <= 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "amount must be a positive number" });
    }
    if (!clinicTiming.days || !clinicTiming.startTime || !clinicTiming.endTime || !clinicTiming.slotDuration) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "clinicTiming requires days, startTime, endTime, slotDuration" });
    }

    // Check doctor profile is approved
    const profile = await DoctorProfile.findOne({ userId: doctorId });
    if (!profile || profile.status !== "Approved") {
      await session.abortTransaction();
      return res.status(403).json({ success: false, message: "Doctor profile is not approved" });
    }

    // Check active subscription
    const now = new Date();
    const activeSubscription = await Subscription.findOne({
      doctorId,
      isActive: true,
      endDate: { $gte: now }
    });
    if (!activeSubscription) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Doctor does not have an active subscription" });
    }

    // Normalize days input (supports abbr and ranges)
    const normalizedDays = normalizeDaysInput(clinicTiming.days);
    // Validate times
    const startMinutes = parseTimeToMinutes(clinicTiming.startTime);
    const endMinutes = parseTimeToMinutes(clinicTiming.endTime);
    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid start/end time" });
    }

    // Create Clinic
    const [clinic] = await Clinic.create([
      {
        doctorId,
        clinicName: String(clinicName).trim(),
        clinicAddress: String(clinicAddress).trim(),
        city: String(city).trim(),
        consultationFee,
        clinicTiming: {
          days: normalizedDays,
          startTime: clinicTiming.startTime,
          endTime: clinicTiming.endTime,
          slotDuration: clinicTiming.slotDuration
        }
      }
    ], { session });

    const clinicId = clinic._id;

    // Generate Slots for next N days (default 7) but never beyond subscription end
    const daysAhead = Number.isInteger(generateDays) && generateDays > 0 ? generateDays : 7;
    const dayNameToNumber = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
    const workingDaysNumbers = normalizedDays.map(d => dayNameToNumber[d]);

    const subscriptionEnd = new Date(activeSubscription.endDate);
    subscriptionEnd.setHours(23, 59, 59, 999);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (subscriptionEnd < today) {
      await session.abortTransaction();
      return res.status(409).json({ success: false, message: "Subscription expired. Renew to generate slots." });
    }

    const tentativeEnd = new Date(today);
    tentativeEnd.setDate(tentativeEnd.getDate() + daysAhead - 1);
    const generationEnd = tentativeEnd < subscriptionEnd ? tentativeEnd : subscriptionEnd;

    const slots = [];
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
        slots.push({ doctorId, clinicId, start: new Date(cursor), end: slotEnd, availability: "available" });
        cursor = slotEnd;
      }
    }

    if (slots.length > 0) {
      await Slot.insertMany(slots, { session, ordered: false });
    }

    await session.commitTransaction();
    session.endSession();
    return res.status(201).json({
      success: true,
      clinic,
      slotsCreated: slots.length,
      fromDate: today,
      toDate: generationEnd,
      subscriptionEnd: activeSubscription.endDate,
      subscriptionCapped: generationEnd.getTime() < tentativeEnd.getTime()
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ success: false, message: err.message });
  }
};

function normalizeDaysInput(input) {
  const fullNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const abbrToFull = {
    sun: "Sunday", mon: "Monday", tue: "Tuesday", tues: "Tuesday", wed: "Wednesday",
    thu: "Thursday", thur: "Thursday", thurs: "Thursday", fri: "Friday", sat: "Saturday"
  };
  const tokens = Array.isArray(input) ? input : String(input).split(/[,\s]+/);
  const result = new Set();
  for (const tokenRaw of tokens) {
    if (!tokenRaw) continue;
    const token = String(tokenRaw).trim();
    if (!token) continue;
    const range = token.includes("-") ? token.split("-") : null;
    if (range && range.length === 2) {
      const start = dayTokenToFull(range[0], fullNames, abbrToFull);
      const end = dayTokenToFull(range[1], fullNames, abbrToFull);
      if (!start || !end) continue;
      let i = fullNames.indexOf(start);
      const endIndex = fullNames.indexOf(end);
      while (true) {
        result.add(fullNames[i]);
        if (i === endIndex) break;
        i = (i + 1) % 7;
      }
      continue;
    }
    const full = dayTokenToFull(token, fullNames, abbrToFull);
    if (full) result.add(full);
  }
  if (result.size === 0) throw new Error("Invalid days input");
  return Array.from(result);
}

function dayTokenToFull(token, fullNames, abbrToFull) {
  const lower = String(token).toLowerCase();
  if (fullNames.some(d => d.toLowerCase() === lower)) {
    return fullNames.find(d => d.toLowerCase() === lower);
  }
  if (abbrToFull[lower]) return abbrToFull[lower];
  return null;
}

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
