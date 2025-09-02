import mongoose from "mongoose";

const slotSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true, index: true },
  // clinicId: { type: mongoose.Schema.Types.ObjectId, ref: "Clinic", required: true, index: true, unique: true },
  start: { type: Date, required: true, index: true },   // slot start time (UTC)
  end: { type: Date, required: true },                  // slot end time (UTC)
  availability: {
    type: String,
    enum: ["available", "booked", "hold", "blocked"],
    default: "available",
    index: true
  },
  // optional extra info
}, { timestamps: true });

// prevent exact duplicate slot for same doctor at same start time (optional)
slotSchema.index({ doctorId: 1, start: 1 }, { unique: true });

export default mongoose.model("Slot", slotSchema);
