import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import validator from "validator";

const profileSchema = new mongoose.Schema(
  {
    _id: {   // use userId as the primary key
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // doctorId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   required: true,
    //   ref: "User",
    //   unique:true
    // },

    name: {
      type: String,
      required: true,
      minlength: [3, "Name must be at least 3 characters long"],
      maxlength: [50, "Name must be at most 50 characters long"],
    },

    bio: {
      type: String,
      trim: true,
    },

    experience: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      validate: {
        validator: validator.isEmail,
        message: "Please provide a valid email",
      },
    },

    password: {
      type: String,
      required: true,
      minlength: [8, "Password must be at least 8 characters long"],
      select: false, // by default exclude password in queries
    },

    contact_no: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate: {
        validator: (v) => /^[0-9]{10}$/.test(v),
        message: "Contact number must be exactly 10 digits",
      },
    },


    degree: {
      type: String,
      required: true,
      trim: true,
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
        "Sexual & Reproductive Health",
      ],
      required: true,
    },
    isProfileRequest:{
      type: Boolean,
      default: false,
  },
      status: {
      type: String,
      enum: ["Approved", "Rejected", "pending"],    
      default: "pending",
    },

  },
  { timestamps: true }
);

//  Password hash before save
profileSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const DoctorProfile = mongoose.model("DoctorProfile", profileSchema);
export default DoctorProfile;
