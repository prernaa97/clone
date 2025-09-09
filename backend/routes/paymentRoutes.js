import express from "express";
import { checkout, paymentVerification, getPaymentHistory } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/checkout", checkout);
router.post("/verify", paymentVerification);
router.get("/history/:userId", getPaymentHistory);

export default router;


