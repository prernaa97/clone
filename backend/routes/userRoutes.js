import express from "express";
import { signIn, signUp } from "../controllers/userController.js";

const router = express.Router();

router.post("/signUp", signUp);       // Create
router.post("/signIn", signIn);       // Read all

export default router;
