import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
} from "../controllers/postController.js";
import { ensureDoctorWithActiveSubscription, validatePostPayload , requireAuth } from "../middlewares/postGuards.js";

const router = express.Router();

// Multer setup
const uploadDir = path.join(process.cwd(), "uploads");
try {
  fs.mkdirSync(uploadDir, { recursive: true });
} catch (e) {
  // ignore mkdir errors; will fail later in destination if truly not writable
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Routes
router.use(requireAuth);
router.post("/", ensureDoctorWithActiveSubscription, upload.array("media", 5), validatePostPayload, createPost); // multiple media files
router.get("/doctor/:doctorId", getPosts);
router.get("/post/:postId", getPostById);
router.put("/:id", ensureDoctorWithActiveSubscription, upload.array("media", 5), validatePostPayload, updatePost);
router.delete("/:id", deletePost);

export default router;
