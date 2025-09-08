import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DoctorProfile",
      required: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    postsUsed: { type: Number, default: 0 },
    paymentId: { type: String },
  },
  {
    timestamps: true,
toJSON: {
  transform: function (doc, ret) {
    function formatDate(date) {
      if (!date) return null;
      const d = new Date(date);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      const ss = String(d.getSeconds()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
    }

    ret.startDate = formatDate(ret.startDate);
    ret.endDate = formatDate(ret.endDate);
    ret.createdAt = formatDate(ret.createdAt);
    ret.updatedAt = formatDate(ret.updatedAt);

    return ret;
  },
},
 }
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);
export default Subscription;


// import mongoose from "mongoose";

// const subscriptionSchema = new mongoose.Schema({
//   doctorId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Doctor",
//     required: true,
//   },
//   planId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Plan",
//     required: true,
//   },
//   startDate: { type: Date, default: Date.now }, 
//   endDate: { type: Date, required: true }, // auto: start + 30 days
//   isActive: { type: Boolean, default: true },
//   postsUsed: { type: Number, default: 0 }, 
//   paymentId: { type: String }, // Razorpay/Stripe txn id
// }, { timestamps: true },
// );

// const Subscription = mongoose.model("Subscription", subscriptionSchema);
// export default Subscription;


