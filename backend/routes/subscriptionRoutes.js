import express from "express";
import { createSubscription, getAllSubscriptions, getDoctorSubscription, updateSubscription, deleteSubscription } from "../controllers/subscriptionController.js";

const router = express.Router();

router.post("/", createSubscription);                 // Doctor buy subscription
router.get("/", getAllSubscriptions);                 // Admin view all
router.get("/:doctorId", getDoctorSubscription);      // Doctor's current subscription
router.put("/:id", updateSubscription);               // Update/extend subscription
router.delete("/:id", deleteSubscription);            // Cancel subscription

export default router;
