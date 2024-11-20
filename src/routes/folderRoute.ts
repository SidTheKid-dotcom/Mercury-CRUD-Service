import express from "express";
import multer from "multer";
import { uploadFolder } from "../controllers/folderController";

const router = express.Router();
const upload = multer({ dest: "uploads/" }); // Temporary folder for uploads

// Route to handle folder uploads
router.post("/", upload.single("codebase"), uploadFolder);

export default router;
