// src/routes/queryRoutes.ts
import express from "express";
import multer from "multer";
import { postQuery, answerQuery, voteQuery, voteAnswer, markAnswerAsOfficial, reportSpam, searchQuery, searchGitHub, getQueryById } from "../controllers/queryController";

const router = express.Router();

// Memory storage so that the file will be stored in memory as a buffer before upload
const storage = multer.memoryStorage();

// Multer configuration
const uploadFileMulter = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Set file size limit (10MB in this case)
});

// Route to post a new query with tags
router.post("/queries", uploadFileMulter.single('file'), postQuery);

router.post("/queries/:id/answer", answerQuery);

router.post('/queries/:id/vote', voteQuery);

router.post('/answers/:answerId/vote', voteAnswer);

router.post('/answers/:answerId/markOfficial', markAnswerAsOfficial);

router.post('/queries/:id/reportSpam', reportSpam);

router.get('/query/:id', getQueryById);    

// Route for search functionality
router.post('/search', uploadFileMulter.single('file'), searchQuery);

// For searching codebase files
router.get('/search/github', searchGitHub);

export default router;

