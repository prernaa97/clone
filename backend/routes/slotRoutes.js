import express from "express";
import {
  createClinicWithSlots,
  createManySlots,
  getSlotsByDoctor,
  getSlotById,
  updateSlot,
  deleteSlot
} from "../controllers/slotController.js";
import { requireAuth, ensureDoctorWithActiveSubscription } from "../middlewares/postGuards.js";

const router = express.Router();

// create single slot
// router.post("/", createSlot);
router.post("/createClinicWithSlots", requireAuth, ensureDoctorWithActiveSubscription, createClinicWithSlots);


// optional: bulk create
router.post("/bulk", createManySlots);

// get slots for a doctor
router.get("/doctor/:doctorId", getSlotsByDoctor);

// slot CRUD
router.get("/:id", getSlotById);
router.put("/:id", updateSlot);
router.delete("/:id", deleteSlot);

export default router;
