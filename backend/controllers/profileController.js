import DoctorProfile from "../models/doctorProfile.js";
import User from "../models/user.js";
import fs from "fs";
import path from "path";
import { getUserIdFromToken } from "../utils/auth.js";
import { createNotification } from "./notificationController.js";

export const submitDoctorProfile = async (req, res) => {
  try {
    const { userId, ...profileData } = req.body;
    console.log("submitDoctorProfile: ", req.body);
    console.log("File uploaded: ", req.file);

    // Prefer token user; fallback to explicit body param to match current controller contract
    let finalUserId = getUserIdFromToken(req) || userId || null;
    if (!finalUserId) return res.status(400).json({ success: false, message: "userId is required" });

    // Try to locate the user for logging/reference, but don't hard-fail if missing
    let user = null;
    if (finalUserId) {
      user = await User.findOne({ _id: finalUserId });
    }
    // Fallback: try matching by email from the submitted profile if token user not found
    if (!user && profileData?.email) {
      const emailUser = await User.findOne({ email: profileData.email.toLowerCase() });
      console.log("emailUser: ", emailUser);
      if (emailUser) {
        user = emailUser;
        finalUserId = emailUser._id.toString();
      }
    }
    const resolvedUserId = user ? user._id : finalUserId;
    console.log("Resolved userId:", resolvedUserId);

    // Find existing profile to handle profile picture replacement
    const existingProfile = await DoctorProfile.findOne({ _id: resolvedUserId });
    
    // Handle profile picture upload
    let profilePicturePath = existingProfile?.profilePicture || null;
    
    if (req.file) {
      // New file uploaded
      const newProfilePicturePath = `/uploads/profiles/${req.file.filename}`;
      
      // Delete old profile picture if it exists and it's different from the new one
      if (existingProfile?.profilePicture && existingProfile.profilePicture !== newProfilePicturePath) {
        // Resolve absolute path safely even if stored path begins with a leading slash
        const oldFilePath = path.resolve(process.cwd(), '.' + existingProfile.profilePicture);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
          console.log("Old profile picture deleted:", oldFilePath);
        }
      }
      
      profilePicturePath = newProfilePicturePath;
    }
    // If no new file uploaded, keep existing profile picture

    const updateData = {
          ...profileData,
      userId: resolvedUserId,
          isProfileRequest: true,
          status: "pending",
    };

    // Only update profile picture if we have a new one or it's an update
    if (profilePicturePath) {
      updateData.profilePicture = profilePicturePath;
    }

    const profile = await DoctorProfile.findOneAndUpdate(
      { _id: resolvedUserId },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(201).json({ 
      success: true, 
      message: "Profile submitted to Admin", 
      profile: {
        ...profile.toObject(),
        profilePictureUrl: profile.profilePicture ? `http://localhost:5000${profile.profilePicture}` : null
      }
    });
  } catch (err) {
    console.log("Error is here: ", err);
    // Duplicate key or validation error handling
    if (err && (err.code === 11000 || err.name === 'MongoServerError')) {
      return res.status(400).json({ success: false, message: "Email or contact number already exists" });
    }
    // Clean up uploaded file if there's an error
    if (req.file) {
      const filePath = path.resolve(process.cwd(), "uploads", "profiles", req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const approveDoctorProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await DoctorProfile.findByIdAndUpdate(
      id,
      { $set: { status: "Approved" } },
      { new: true }
    ).populate('userId', 'name email');
    
    if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });
    
    // Create notification for the user
    await createNotification(
      profile.userId._id,
      "profile_approved",
      "Profile Approved!",
      "Congratulations! Your doctor profile has been approved. You can now proceed to choose a subscription plan.",
      { profileId: profile._id }
    );
    
    console.log(`Profile approved for user: ${profile.userId.email} - Ready for payment`);
    
    return res.json({ 
      success: true, 
      message: "Profile approved. User can now proceed to payment.", 
      profile 
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllDoctorProfiles = async (req, res) => {
  try {
    const { status } = req.query; // Optional status filter: pending, Approved, Rejected
    
    const filter = status ? { status } : {};
    
    const profiles = await DoctorProfile.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 }); // Latest first
    
    // Add full profile picture URLs
    const profilesWithUrls = profiles.map(profile => ({
      ...profile.toObject(),
      profilePictureUrl: profile.profilePicture ? `http://localhost:5000${profile.profilePicture}` : null
    }));

    return res.json({ 
      success: true, 
      profiles: profilesWithUrls,
      count: profilesWithUrls.length 
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const rejectDoctorProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await DoctorProfile.findByIdAndUpdate(
      id,
      { $set: { status: "Rejected" } },
      { new: true }
    ).populate('userId', 'name email');
    
    if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });
    
    // Create notification for the user
    await createNotification(
      profile.userId._id,
      "profile_rejected",
      "Profile Rejected",
      "Unfortunately, your doctor profile application was not approved. You can continue using the platform as a patient.",
      { profileId: profile._id }
    );
    
    console.log(`Profile rejected for user: ${profile.userId.email}`);
    
    return res.json({ 
      success: true, 
      message: "Profile rejected. User will be notified to continue as patient.", 
      profile 
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getProfileStats = async (req, res) => {
  try {
    const [pendingCount, approvedCount, rejectedCount, totalCount] = await Promise.all([
      DoctorProfile.countDocuments({ status: "pending" }),
      DoctorProfile.countDocuments({ status: "Approved" }),
      DoctorProfile.countDocuments({ status: "Rejected" }),
      DoctorProfile.countDocuments({})
    ]);

    return res.json({
      success: true,
      stats: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        total: totalCount
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};


