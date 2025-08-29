import express from "express";
import bodyParser from "body-parser";
import connectDB from "./config/db.js";

import doctorRoutes from "./routes/doctorRoutes.js";
import doctorProfileRoutes from "./routes/profileRoutes.js";
import doctorPostRoutes from "./routes/postsRoutes.js"
import slotRoutes from "./routes/slotRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js"
import planRoutes from "./routes/planRoutes.js"



const app = express();
app.use(express.json());
app.use(bodyParser.json());

// DB Connect
connectDB();



app.use("/uploads", express.static("uploads")); // serve media files
app.use("/api/doctors", doctorRoutes);
app.use("/api/profiles", doctorProfileRoutes);
app.use("/api/posts", doctorPostRoutes);
app.use("/api/slots", slotRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/subscription",subscriptionRoutes);
app.use("/api/plan",planRoutes);

app.listen(5000, () => console.log(" Server running on port 5000"));
