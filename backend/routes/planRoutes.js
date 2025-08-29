import express from "express";
import { createPlan, getAllPlans, getPlanById, updatePlan, deletePlan } from "../controllers/planController.js";

const router = express.Router();

router.post("/", createPlan);      // Admin create plan
router.get("/", getAllPlans);      // All users can see plans
router.get("/:id", getPlanById);   // Get single plan
router.put("/:id", updatePlan);    // Admin update plan
router.delete("/:id", deletePlan); // Admin delete plan

export default router;
