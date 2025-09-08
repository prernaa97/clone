import express from "express";
import { sendProfileStatusNotification } from "../controllers/notificationController.js";

const router = express.Router();

router.post("/profile-status", sendProfileStatusNotification);

export default router;
