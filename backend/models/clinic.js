import mongoose, { Schema } from "mongoose";

const clinic = new Schema({
    doctorId:{
        type: Schema.Types.ObjectId,
        ref: 'DoctorProfile',
        required: true,
    },
    clinicName: {
      type: String,
      required: [true, "Clinic name is required"],
      trim: true,
      minlength:[3,"Name must be at least 3 character Long"],
      maxlength:[50,"Name must be at most 50 character long"],
      unique: true // ensures only one clinic per doctor
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
      minlength:[3,"Name must be at least 3 character Long"],
      maxlength:[50,"Name must be at most 50 character long"],
    },
consultationFee: {
    type: Number,
    required: [true, "Consultation fee is required"],
    validate: {
      validator: function (v) {
        return Number.isInteger(v) && v > 0;
      },
      message: props => `${props.value} is not a valid consultation fee (must be a positive number)`
    }
  },
    clinicTiming: {
    days: {
      type: [String],
      required: [true, "At least one working day is required"],
      validate: {
        validator: function (v) {
          if (!Array.isArray(v)) return false;
          const validDays = [
            "Monday", "Tuesday", "Wednesday",
            "Thursday", "Friday", "Saturday", "Sunday"
          ];
          return v.every(day => validDays.includes(day));
        },
        message: props => `${props.value} contains invalid day(s)`
      }
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      validate: {
        validator: function (v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9] (AM|PM)$/i.test(v);
        },
        message: props => `${props.value} is not a valid start time (use HH:MM AM/PM format)`
      }
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
      validate: {
        validator: function (v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9] (AM|PM)$/i.test(v);
        },
        message: props => `${props.value} is not a valid end time (use HH:MM AM/PM format)`
      }
    }
    },
  
});
const Clinic = mongoose.model("Clinic", clinic);
export default Clinic;
