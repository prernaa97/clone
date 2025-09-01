import mongoose, { Schema } from "mongoose";
import userInfoTable from "./userInfo.model.js"
import User from "./user.model.js"

const clinic = new Schema({
    doctorId:{
        type: Schema.Types.ObjectId,
        ref: 'DoctorProfile',
        required: true,
    },
    clinicName: {
      type: String,
      required: true,
      trim: true,
    },

    clinicAddress: {
      type: String,
      required: true,
      trim: true,
      minlength: [10, "Address must be at least 10 characters long"],
      maxlength: [80, "Address can be at most 80 characters long"],
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },
    consultationFee: { type: Number, required: true },
        clinicTiming: {
      days: [String], // e.g. ["Monday", "Tuesday", ...]
      startTime: String, // "09:00 AM"
      endTime: String, // "05:00 PM"
    },
    clinicTiming: {
      days: [String],
      startTime: String,
      endTime: String,
    },

});
const Clinic = mongoose.model("Clinic", clinic);
export default Clinic;
