import DoctorPost from "../models/doctorPost.js";
import DoctorProfile from "../models/doctorProfile.js";
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

// Getall posts for a specific doctor
export const getPosts = async (req, res) => {
  try {
    const { doctorId } = req.params; // send userId
    if (!doctorId) {
      return res.status(400).json({ success: false, message: "DoctorId is required in params" });
    }
    // 1. Check doctor exists
    const doctor = await DoctorProfile.findOne({ _id: doctorId });
     console.log("doctor: ", doctor);

    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
   // 2. Get posts of that doctor
    const posts = await DoctorPost.find({ doctor: doctor._id })
      .populate("doctor", "name email specialization experience"); 

    return res.status(200).json({
      success: true,
      doctor,   // doctor profile info
      posts     // list of doctor posts
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

//  Get a Single Post by PostId
export const getPostById = async (req, res) => {
  console.log("called----------------------------------------------------------------------");
  try {
    const { postId } = req.params;
    console.log("getPostById called" , req.params);

    const post = await DoctorPost.findById(postId)
       .populate("doctor", "name email specialization");
      console.log("Post is here: ", post);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    res.status(200).json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


//  Update post
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
