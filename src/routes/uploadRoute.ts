import express from "express";
import multer from "multer";
import { uploadFolder, uploadFile, uploadCSV, uploadGithubUrl, getAllFiles, getAllCSVs, getAllGithubRepos,  } from "../controllers/uploadController";

const router = express.Router();
const uploadFolderMulter = multer({ dest: "uploads/" }); // Temporary folder for uploads

// Memory storage so that the file will be stored in memory as a buffer before upload
const storage = multer.memoryStorage();

// Multer configuration
const uploadFileMulter = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Set file size limit (10MB in this case)
});

// Route to handle folder uploads
router.post("/folder", uploadFolderMulter.single("codebase"), uploadFolder);

// Router to handle file uploads
router.post('/file', uploadFileMulter.single('file'), uploadFile);

// Route to handle CSV Uploads
router.post('/csv', uploadFileMulter.single('file'), uploadCSV);

// Route to handle github url uploads
router.post('/github', uploadGithubUrl);

// Route to get all uploaded files
router.get('/files', getAllFiles);

// Route to get all csv files
router.get('/csv', getAllCSVs);

// Route to get all uplaoded github repos with json structure
router.get('/github', getAllGithubRepos);

export default router;
