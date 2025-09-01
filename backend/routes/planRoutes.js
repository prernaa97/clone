import express from "express";
import {
  getAllPlans,
  createPlan,
  deletePlan,
  getPlanById,
} from "../controllers/planController.js";

const router = express.Router();

// GET all plans
router.get("/", getAllPlans);

// CREATE or UPDATE plan
router.post("/manage", createPlan);

// SOFT DELETE plan
router.delete("/:id", deletePlan);

// GET single plan
router.get("/:id", getPlanById);

export default router;
