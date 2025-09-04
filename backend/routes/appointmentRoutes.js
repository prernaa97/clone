import express from "express";
import {
  bookAppointment,
  getAppointmentById,
  cancelAppointment,
  listAppointments
} from "../controllers/appointmentController.js";
import { prepareAppointment, finalizeAppointment } from "../middlewares/appointmentBooking.js";

const router = express.Router();

router.post("/bookAppointment", bookAppointment);
// New flow with payment verify + atomic booking
router.post("/prepare", prepareAppointment, (req, res) => res.status(200).json({ success: true, ready: true, fee: req.appointmentContext?.fee }));
router.post("/finalize", prepareAppointment, finalizeAppointment);
router.get("/", listAppointments);
router.get("/:id", getAppointmentById);
router.put("/:id/cancel", cancelAppointment);

// additional: reschedule endpoint can be added later

export default router;
