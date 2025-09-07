import mongoose from "mongoose";
import Subscription from "../models/Subscription.js";
import Role from "../models/roles.js";
import UserRole from "../models/userRoles.js";

import jwt from "jsonwebtoken";

export const requireAuth = (req, res, next) => {
  try {
    const auth = req.headers.authorization || "";
    console.log("Token from Auth: ", auth);
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
    }
    // Verify token
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    console.log("payload", payload);
    // Attach user data to request object; support sub/id
    req.user = { id: payload.id || payload.sub };
    next();
  } catch (err) {
    console.error("Auth Error:", err.message);
    return res.status(401).json({ success: false, message: "Unauthorized: Invalid or expired token" });
  }
};

// Ensure current user is a Doctor and has an active subscription within post limit
export const ensureDoctorWithActiveSubscription = async (req, res, next) => {
  try {
    const currentUserId = req.user?.id || req.user?.sub || req.user?._id?.toString() || req.user?.userId;
    console.log("currentUserId: ",currentUserId);
    if (!currentUserId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Role check: user must have Doctor role
    const doctorRole = await Role.findOne({ name: "Doctor" });
    if (!doctorRole) {
      return res.status(403).json({ success: false, message: "Doctor role not configured" });
    }
    const hasDoctorRole = await UserRole.findOne({ userId: currentUserId, roleId: doctorRole._id });
    if (!hasDoctorRole) {
      return res.status(403).json({ success: false, message: "Only doctors can create or update posts" });
    }

    // Active subscription check
    const now = new Date();
    let subscription = await Subscription.findOne({ doctorId: currentUserId, isActive: true }).populate("planId");
    if (!subscription) {
      return res.status(403).json({ success: false, message: "No active subscription found" });
    }
    if (subscription.endDate < now) {
      subscription.isActive = false;
      await subscription.save();
      return res.status(403).json({ success: false, message: "Subscription expired" });
    }

    // Post limit check (only for create and publish transitions)
    req.postGuard = { subscription };
    return next();
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Validate media and status transitions for posts
export const validatePostPayload = (req, res, next) => {
  try {
    const body = req.body || {}; // model parameter
    const status = body.status; // draft | published | archived

    if (status && !["draft", "published", "archived"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    // Media: accept multiple images or a single video link (url) in body, or uploaded files (multer)
    // If files are uploaded, controller will map them. If a video link is provided, expect req.body.videoUrl
    return next();
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};


