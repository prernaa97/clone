import Notification from "../models/Notification.js";
import { getUserIdFromToken } from "../utils/auth.js";

// Get notifications for a user
export const getUserNotifications = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req) || req.query.userId;
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50); // Limit to recent 50 notifications

    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    return res.json({
      success: true,
      notifications,
      unreadCount,
      totalCount: notifications.length
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = getUserIdFromToken(req);

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    return res.json({ success: true, notification });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Mark all notifications as read for a user
export const markAllAsRead = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    return res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create notification (internal function)
export const createNotification = async (userId, type, title, message, data = {}) => {
  try {
    const notification = new Notification({
      userId,
      type,
      title,
      message,
      data,
      isRead: false
    });
    
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Get notification counts for admin dashboard
export const getAdminNotificationCounts = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    // Count admin-specific notifications
    const pendingProfilesCount = await Notification.countDocuments({ 
      userId, 
      type: "admin_profile_pending", 
      isRead: false 
    });

    return res.json({
      success: true,
      counts: {
        pendingProfiles: pendingProfilesCount,
        total: pendingProfilesCount
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};