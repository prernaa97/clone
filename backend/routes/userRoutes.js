import express from "express";
import { signIn, signUp, getUserRoles } from "../controllers/userController.js";

const router = express.Router();

router.post("/signUp", signUp);       // Create
router.post("/signIn", signIn);       // Read all
router.get("/:id/roles", getUserRoles);
// Back-compat alternate path if some clients call /users/roles/:id
router.get("/roles/:id", getUserRoles);

export default router;
