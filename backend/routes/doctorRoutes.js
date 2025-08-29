import express from "express";
import {
  createDoctor,
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
} from "../controllers/doctorController.js";

const router = express.Router();

router.post("/", createDoctor);       // Create
router.get("/", getAllDoctors);       // Read all
router.get("/:id", getDoctorById);    // Read one
router.put("/:id", updateDoctor);     // Update
router.delete("/:id", deleteDoctor);  // Delete

export default router;
