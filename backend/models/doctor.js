import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, required: true, lowercase: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },

    subscriptionStatus: {
      type: String,
      enum: ["active", "expired", "pending"],    
      default: "pending",
    },
  },
  { timestamps: true }
);
const Doctor=mongoose.model("Doctor",doctorSchema);                                         
export default Doctor;

