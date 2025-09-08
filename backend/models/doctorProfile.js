import mongoose from "mongoose";
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

    // password removed for DoctorProfile; authentication handled by User model

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

    profilePicture: {
      type: String,
      default: null,
      trim: true,
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

// no password hashing needed here

const DoctorProfile = mongoose.model("DoctorProfile", profileSchema);
export default DoctorProfile;
