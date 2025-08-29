import express from "express";
import {
  bookAppointment,
  getAppointmentById,
  cancelAppointment,
  listAppointments
} from "../controllers/appointmentController.js";

const router = express.Router();

router.post("/", bookAppointment);
router.get("/", listAppointments);
router.get("/:id", getAppointmentById);
router.put("/:id/cancel", cancelAppointment);

// additional: reschedule endpoint can be added later

export default router;
