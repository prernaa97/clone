import express from "express";
import {
  createDoctorProfile,
  getAllProfiles,
  getProfileById,
  updateDoctorProfile,
  deleteDoctorProfile
} from "../controllers/profileController.js";

const router = express.Router();

// Routes
router.post("/", createDoctorProfile);         // Create profile
router.get("/", getAllProfiles);               // Get all profiles
router.get("/:id", getProfileById);            // Get single profile
router.put("/:id", updateDoctorProfile);       // Update profile
router.delete("/:id", deleteDoctorProfile);    // Delete profile

export default router;
