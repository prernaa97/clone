import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    doctorId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Doctor", 
      unique: true,
      required: true
    },

    specialization: {
      type: String,
      enum: [
        "Gynecology",
        "Obstetrics",
        "Infertility & IVF",
        "Menstrual & Menopause Care",
        "PCOS/PCOD",
        "Reproductive Cancers",
        "Family Planning & Contraception",
        "Maternal & Child Health",
        "Sexual & Reproductive Health"
      ],
      required: true,
    },

    degrees: { type: String, required: true },
    experience: { type: Number, required: true }, // in years
    consultationFee: { type: Number, required: true },

    clinicName: { type: String, required: true },
    clinicAddress: { type: String, required: true },

    clinicTiming: {
      days: [String],   // e.g. ["Monday", "Tuesday", ...]
      startTime: String, // "09:00 AM"
      endTime: String,   // "05:00 PM"
    },

    availableSlots: [
      {
        date: { type: Date, required: true },    // e.g. 2025-08-30
        time: { type: String, required: true },  // e.g. "10:30 AM"
        isBooked: { type: Boolean, default: false },
      },
    ],

    contactMethods: {
      video: { type: Boolean, default: false },
      audio: { type: Boolean, default: false },
      chat: { type: Boolean, default: false },
    },

    // documents: [String], // certificate, license, etc.
  },
  { timestamps: true }
);

const DoctorProfile=mongoose.model("DoctorProfile", profileSchema);
export default DoctorProfile;
