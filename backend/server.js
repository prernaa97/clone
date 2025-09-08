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
import notificationRoutes from "./routes/notificationRoutes.js";
import Role from './models/roles.js';
import User from './models/user.js';
import UserRole from './models/userRoles.js';
import bcrypt from "bcryptjs";

dotenv.config();

const app = express();

// ===== Middleware =====

// Enable CORS for frontend
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"], // allow both ports
// React frontend URL
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ===== Database Connect =====
connectDB().then(() => {
  seedRoles();
  seedAdmin();
});

// ===== Routes =====
app.use("/users", authRoutes);
app.use("/uploads", express.static("uploads")); // serve media files including profile pictures
app.use("/api/doctors", doctorRoutes);
app.use("/api/profiles", doctorProfileRoutes);
app.use("/api/posts", doctorPostRoutes);
app.use("/api/slots", slotRoutes); //temp
app.use("/api/appointments", appointmentRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/plan", planRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/clinic", clinicRoutes);
app.use("/api/notifications", notificationRoutes);

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

// ===== Seed Admin =====
async function seedAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@healthcare.com" });
    if (existingAdmin) {
      console.log("Admin already exists, skipping seeding");
      return;
    }

    // Get Admin role
    const adminRole = await Role.findOne({ name: "Admin" });
    if (!adminRole) {
      console.error("Admin role not found. Please run seedRoles first.");
      return;
    }

    // Create admin user
    const adminUser = new User({
      name: "System Administrator",
      email: "admin@healthcare.com",
      password: "Admin@123",        
      contact_no: "9999999999",     
      isVerified: true
    });

    const savedAdmin = await adminUser.save();
    console.log(" Admin user created:", savedAdmin.email);

    // Assign admin role
    const userRole = new UserRole({
      userId: savedAdmin._id,
      roleId: adminRole._id
    });

    await userRole.save();
    console.log(" Admin role assigned to user");
    console.log(" Admin Email: admin@healthcare.com");
    console.log(" Admin Password: Admin@123");

  } catch (error) {
    console.error(" Error seeding admin:", error);
  }
}