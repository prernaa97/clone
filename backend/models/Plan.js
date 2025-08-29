import mongoose from "mongoose";

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    enum: ["Free", "Basic", "Standard", "Premium"],
    required: true,
  },
  price: { type: Number, required: true }, // per month
  postLimit: { type: Number, required: true }, // free=2, basic=4, standard=6, premium=10
  durationInDays: { type: Number, default: 30 },  //validity 
  isActive: { type: Boolean, default: true },
},{ timestamps: true });

export default mongoose.model("Plan", planSchema);
