import 'dotenv/config';
import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import connectDB from "./config/db.js";
import clinicRoutes from "./routes/clinicRoutes.js"
import cors from "cors";

import doctorRoutes from "./routes/doctorRoutes.js";
import doctorProfileRoutes from "./routes/profileRoutes.js";
import doctorPostRoutes from "./routes/postsRoutes.js";
import slotRoutes from "./routes/slotRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import planRoutes from "./routes/planRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import authRoutes from "./routes/userRoutes.js";
import Role from './models/roles.js';

dotenv.config();

const app = express();

// ===== Middleware =====

// Enable CORS for frontend
app.use(cors({
  origin: "http://localhost:5173", // React frontend URL
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ===== Database Connect =====
connectDB().then(() => {
  seedRoles();
});

// ===== Routes =====
app.use("/users", authRoutes);
app.use("/uploads", express.static("uploads")); // serve media files
app.use("/api/doctors", doctorRoutes);
app.use("/api/profiles", doctorProfileRoutes);
app.use("/api/posts", doctorPostRoutes);
app.use("/api/slots", slotRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/plan", planRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/clinic", clinicRoutes);

// ===== Start Server =====
app.listen(5000, () => console.log("Server running on port 5000"));

// ===== Seed Roles =====
async function seedRoles() {
  try {
    const roles = ["Admin", "Doctor", "User"];

    for (let role of roles) {
      const exists = await Role.findOne({ name: role });
      if (!exists) {
        await Role.create({ name: role });
        console.log(`Role '${role}' inserted`);
      } else {
        console.log(`Role '${role}' already exists`);
      }
    }
  } catch (err) {
    console.error("Error seeding roles:", err.message);
  }
}
//PrernaGawande@1684 passwod  PrernaGawande username