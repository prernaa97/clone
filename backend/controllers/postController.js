import DoctorPost from "../models/doctorPost.js";
import Subscription from "../models/Subscription.js";

//  Create Post with subscription check + media upload
export const createPost = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { title, description, mediaType, status = "draft", videoUrl } = req.body;

    const subscription = req.postGuard?.subscription || await Subscription.findOne({ doctorId, isActive: true }).populate("planId");
    if (!subscription) return res.status(403).json({ success: false, message: "No active subscription found" });
    if (new Date() > subscription.endDate) {
      subscription.isActive = false; await subscription.save();
      return res.status(403).json({ success: false, message: "Subscription expired" });
    }
    if (subscription.postsUsed >= subscription.planId.postLimit) {
      return res.status(403).json({ success: false, message: "Post limit reached for your plan" });
    }

    // Prepare media
    let mediaFiles = [];
    if (mediaType === "video") {
      if (!videoUrl) return res.status(400).json({ success: false, message: "videoUrl is required for video post" });
      mediaFiles = [videoUrl];
    } else {
      if (req.files && req.files.length > 0) {
        mediaFiles = req.files.map((file) => `/uploads/${file.filename}`);
      }
    }

    const post = await DoctorPost.create({
      doctor: doctorId,
      title,
      description,
      media: mediaFiles,
      mediaType: mediaType || (req.files?.length ? "image" : "image"),
      status,
    });

    subscription.postsUsed += 1;
    await subscription.save();

    return res.status(201).json({ success: true, message: "Post created successfully", data: post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

// Get all posts
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
    const updates = { ...req.body };
    if (updates.status && !["draft", "published", "archived"].includes(updates.status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }
    const post = await DoctorPost.findByIdAndUpdate(req.params.id, updates, { new: true });
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
