import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DoctorProfile", // One-to-Many relation (ek doctor ke multiple posts)
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    media: [
      {
        type: String, // yaha sirf file ka path/url save hoga (image/video dono ka)
        required: true
      },
    ],
    mediaType: {
      type: String,
      enum: ["image", "video"], // ek post me ya to image(s) ya video(s)
      required: true,
    },
    category: {
      type: String,
      enum: [
        "Emotional Wellbeing",
        "Health",
        "Exercise",
        "Hygiene",
        "Nutrition",
        "Pregnancy Care",
        "Other",
      ],
      default: "Other",
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
  },
  { timestamps: true }
);

const DoctorPost= mongoose.model("Post", postSchema);
export default DoctorPost;
