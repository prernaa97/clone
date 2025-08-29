import DoctorPost from "../models/doctorPost.js";
import DoctorPost from "../models/doctorPost.js";
import Subscription from "../models/Subscription.js";

// ✅ Create Post with subscription check + media upload
export const createPost = async (req, res) => {
  try {
    const doctorId = req.user.id; // doctor ka id token se aa raha hai
    const { title, description, type, status } = req.body;

    // 🔹 active subscription find karo
    let subscription = await Subscription.findOne({ doctorId, isActive: true }).populate("planId");

    if (!subscription) {
      return res.status(403).json({ success: false, message: "No active subscription found" });
    }

    // 🔹 expiry check
    if (new Date() > subscription.endDate) {
      subscription.isActive = false;
      await subscription.save();
      return res.status(403).json({ success: false, message: "Subscription expired" });
    }

    // 🔹 post limit check
    if (subscription.postsUsed >= subscription.planId.postLimit) {
      return res.status(403).json({ success: false, message: "Post limit reached for your plan" });
    }

    // 🔹 media files handle karo
    let mediaFiles = [];
    if (req.files && req.files.length > 0) {
      mediaFiles = req.files.map((file) => ({
        url: `/uploads/${file.filename}`,
        type: file.mimetype.startsWith("video") ? "video" : "image",
      }));
    }

    // 🔹 post create karo
    const post = await DoctorPost.create({
      doctor: doctorId,
      title,
      description,
      media: mediaFiles,
      type,
      status,
    });

    // 🔹 postsUsed update karo
    subscription.postsUsed += 1;
    await subscription.save();

    return res.status(201).json({ success: true, message: "Post created successfully", data: post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

// ✅ Get all posts
export const getPosts = async (req, res) => {
  try {
    const posts = await DoctorPost.find().populate("doctor", "name email");
    res.status(200).json({ success: true, data: posts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Get post by ID
export const getPostById = async (req, res) => {
  try {
    const post = await DoctorPost.findById(req.params.id).populate("doctor", "name email");
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    res.status(200).json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Update post
export const updatePost = async (req, res) => {
  try {
    const post = await DoctorPost.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    res.status(200).json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Delete post
export const deletePost = async (req, res) => {
  try {
    const post = await DoctorPost.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    res.status(200).json({ success: true, message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
