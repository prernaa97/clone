import mongoose, { Schema } from "mongoose";

const planSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Plan name is required"],
      minlength: [3, "Plan name must be at least 3 characters"],
      maxlength: [100, "Plan name must be at most 100 characters"],
      trim: true,
    },
    days: {
      type: Number,
      required: [true, "Number of days is required"],
      min: [1, "Days must be greater than 0"],
    },
    postLimit: {
      type: Number,
      required: [true, "Post limit is required"],
      min: [1, "Post limit must be greater than 0"],
    },
    discount: {
      type: Number,
      required: [true, "Discount percentage is required"],
      min: [0, "Discount cannot be less than 0"],
      max: [100, "Discount cannot be more than 100"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price must be at least 0"],
      max: [9999999999.99, "Price exceeds the allowed limit"],
    },
    createdDate: {
      type: Date,
      default: Date.now,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Update `lastUpdated` automatically before saving
planSchema.pre("save", function (next) {
  this.lastUpdated = new Date();
  next();
});

const Plan = mongoose.model("Plan", planSchema);
export default Plan;
