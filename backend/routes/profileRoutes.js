import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  submitDoctorProfile,
  approveDoctorProfile,
  rejectDoctorProfile,
  getAllDoctorProfiles,
  getProfileStats,
} from "../controllers/profileController.js";

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadDir = path.join(process.cwd(), "uploads", "profiles");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `profile-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Only allow image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

router.post("/submit", upload.single("profilePicture"), submitDoctorProfile);
router.get("/all", getAllDoctorProfiles); // Get all profiles with optional status filter
router.get("/stats", getProfileStats); // Get profile statistics
router.put("/:id/approve", approveDoctorProfile);
router.put("/:id/reject", rejectDoctorProfile);

export default router;
