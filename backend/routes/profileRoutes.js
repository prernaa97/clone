import express from "express";
import {
  submitDoctorProfile,
  approveDoctorProfile,
  rejectDoctorProfile,
} from "../controllers/profileController.js";

const router = express.Router();

router.post("/submit", submitDoctorProfile);
router.put("/:id/approve", approveDoctorProfile);
router.put("/:id/reject", rejectDoctorProfile);

export default router;
