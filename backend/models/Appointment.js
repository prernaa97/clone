import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  slotId: { type: mongoose.Schema.Types.ObjectId, ref: "Slot", required: true, unique: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

  type: { type: String, enum: ["walk-in", "virtual", "home-visit"], default: "virtual" },

  status: {
    type: String,
    enum: ["pending", "confirmed", "rescheduled", "cancelled", "completed"],
    default: "pending"
  },

  fee: { type: Number, required: true },
  paymentId: { type: String },               // payment gateway id
  paymentStatus: { type: String, enum: ["pending","paid","refunded"], default: "pending" },

  bookedAt: { type: Date, default: Date.now },
  confirmedAt: Date,
  cancelledAt: Date,
  completedAt: Date,

  notes: String
}, { timestamps: true });

export default mongoose.model("Appointment", appointmentSchema);
