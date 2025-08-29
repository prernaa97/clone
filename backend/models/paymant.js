import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
        razorpay_order_id: {
        type: DataTypes.STRING,
        allowNull:false
    },
    razorpay_payment_id: {
        type: DataTypes.STRING,
        allowNull:false
    },
    razorpay_signature: {
        type: DataTypes.STRING,
        allowNull:false
    },
    amount:{
        type:DataTypes.FLOAT,
        allowNull:false
   }
   ,
   sub_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subscription",
        required: true,
        unique: true
    },

  },{ timestamps: true });

export default mongoose.model("Payment", paymentSchema);
