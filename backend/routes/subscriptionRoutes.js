import express from "express";
import { createSubscription, getSubscriptionsByDoctor } from "../controllers/doctorController.js";
import { prepareRenewal, finalizeRenewal } from "../middlewares/subscriptionRenewal.js";

const router = express.Router();

router.post("/", createSubscription);
router.get("/doctor/:doctorId", getSubscriptionsByDoctor);
// Renewal chain: first prepare (may ask for confirmation), then finalize
router.post("/renew/prepare", prepareRenewal, (req, res) => {
  return res.status(200).json({ success: true, ready: true });
});
router.post("/renew/finalize", prepareRenewal, finalizeRenewal);

export default router;
