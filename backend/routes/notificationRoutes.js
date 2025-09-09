import express from "express";
import { 
  getUserNotifications, 
  markAsRead, 
  markAllAsRead,
  getAdminNotificationCounts
} from "../controllers/notificationController.js";

const router = express.Router();

// Get user notifications
router.get("/", getUserNotifications);

// Get admin notification counts
router.get("/admin/counts", getAdminNotificationCounts);

// Mark notification as read
router.put("/:notificationId/read", markAsRead);

// Mark all notifications as read
router.put("/mark-all-read", markAllAsRead);

export default router;