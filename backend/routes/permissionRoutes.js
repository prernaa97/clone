import express from "express";
import { requirePermission } from "../middlewares/permission.js";

const router = express.Router();

// Example: only users with "ManageUsers" permission can create user
router.post("/users", requirePermission("ManageUsers", true), async (req, res) => {
  // create user logic
  res.json({ message: "User created successfully" });
});

export default router;
