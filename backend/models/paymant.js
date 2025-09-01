import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    razorpay_order_id: { type: String, required: true, trim: true },
    razorpay_payment_id: { type: String, required: true, trim: true },
    razorpay_signature: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    sub_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["created", "paid", "failed", "refunded"],
      default: "paid",
    },
    currency: { type: String, default: "INR" },
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;