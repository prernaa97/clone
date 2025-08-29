import mongoose from "mongoose";
import Slot from "../models/Slot.js";
import Appointment from "../models/Appointment.js";

/**
 * Book a slot -> create appointment.
 * Body: { slotId, userId, type, fee, paymentId (optional) }
 * This function tries to safely mark slot as booked and create appointment.
 */
export const bookAppointment = async (req, res) => {
  const { slotId, userId, type, fee, paymentId } = req.body;

  // prefer transactions if replica set available
  const session = await mongoose.startSession();
  try {
    // Try transaction first
    session.startTransaction();

    // 1) atomically change slot availability only if it is available
    const slot = await Slot.findOneAndUpdate(
      { _id: slotId, availability: "available" },
      { $set: { availability: "booked" } },
      { new: true, session }
    );
    if (!slot) {
      await session.abortTransaction();
      return res.status(409).json({ success: false, message: "Slot not available" });
    }

    // 2) create appointment
    const [appointment] = await Appointment.create([{
      slotId,
      doctorId: slot.doctorId,
      userId,
      type,
      status: "confirmed",
      fee,
      paymentId,
      paymentStatus: paymentId ? "paid" : "pending",
      bookedAt: new Date()
    }], { session });

    await session.commitTransaction();
    return res.status(201).json({ success: true, data: appointment });
  } catch (err) {
    // If transactions fail (e.g., not replica set), fallback to atomic update method
    try {
      await session.abortTransaction();
    } catch (e) { /* ignore */ }
    // Fallback atomic approach (without transactions)
    try {
      // try to set slot as booked
      const slot = await Slot.findOneAndUpdate(
        { _id: slotId, availability: "available" },
        { $set: { availability: "booked" } },
        { new: true }
      );
      if (!slot) return res.status(409).json({ success: false, message: "Slot not available" });

      const appointment = await Appointment.create({
        slotId,
        doctorId: slot.doctorId,
        userId,
        type,
        status: "confirmed",
        fee,
        paymentId,
        paymentStatus: paymentId ? "paid" : "pending",
        bookedAt: new Date()
      });
      return res.status(201).json({ success: true, data: appointment });
    } catch (fallbackErr) {
      // attempt to release slot if something went wrong
      try { await Slot.findByIdAndUpdate(slotId, { availability: "available" }); } catch (e) {}
      return res.status(500).json({ success: false, message: fallbackErr.message });
    } finally {
      session.endSession();
    }
  } finally {
    try { session.endSession(); } catch (e) {}
  }
};

export const getAppointmentById = async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id)
      .populate("doctorId", "name")
      .populate("userId", "name email");
    if (!appt) return res.status(404).json({ success: false, message: "Appointment not found" });
    return res.status(200).json({ success: true, data: appt });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// cancel appointment -> mark appointment cancelled and free up slot
export const cancelAppointment = async (req, res) => {
  const apptId = req.params.id;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const appt = await Appointment.findById(apptId).session(session);
    if (!appt) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }
    if (appt.status === "cancelled") {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Appointment already cancelled" });
    }

    appt.status = "cancelled";
    appt.cancelledAt = new Date();
    await appt.save({ session });

    // free the slot
    await Slot.findByIdAndUpdate(appt.slotId, { availability: "available" }, { session });

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "Appointment cancelled" });
  } catch (err) {
    try { await session.abortTransaction(); } catch (e) {}
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    try { session.endSession(); } catch (e) {}
  }
};

// list appointments for user or doctor (query params)
export const listAppointments = async (req, res) => {
  try {
    const { doctorId, userId } = req.query;
    const q = {};
    if (doctorId) q.doctorId = doctorId;
    if (userId) q.userId = userId;
    const appts = await Appointment.find(q).sort({ bookedAt: -1 });
    return res.status(200).json({ success: true, data: appts });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
