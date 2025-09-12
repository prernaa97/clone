import express from "express";
import {
  // createClinic,
  getAllClinics,
  getClinicById,
  getClinicByDoctorId,
  updateClinic,
  deleteClinic,
} from "../controllers/clinicController.js";

const router = express.Router();

// router.post("/createClinic", createClinic);
router.get("/", getAllClinics);
router.get("/doctor/:doctorId", getClinicByDoctorId);  // Get clinic by doctor ID
router.get("/:id", getClinicById);
router.put("/:id", updateClinic);
router.delete("/:id", deleteClinic);

export default router;
