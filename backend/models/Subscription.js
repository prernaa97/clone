import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true,
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Plan",
    required: true,
  },
  startDate: { type: Date, default: Date.now }, 
  endDate: { type: Date, required: true }, // auto: start + 30 days
  isActive: { type: Boolean, default: true },
  postsUsed: { type: Number, default: 0 }, 
  paymentId: { type: String }, // Razorpay/Stripe txn id
});

export default mongoose.model("Subscription", subscriptionSchema);

