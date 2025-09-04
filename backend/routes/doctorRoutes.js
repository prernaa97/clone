import express from "express";
import {
  createSubscription,
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  getSubscriptionStatus,
} from "../controllers/doctorController.js";

const router = express.Router();

router.post("/createSubscription", createSubscription);       // Create
router.get("/", getAllDoctors);       // Read all
router.get("/:id", getDoctorById);    // Read one
router.put("/:id", updateDoctor);     // Update
router.delete("/:id", deleteDoctor);  // Delete
router.get("/subscription/status", getSubscriptionStatus);

export default router;
