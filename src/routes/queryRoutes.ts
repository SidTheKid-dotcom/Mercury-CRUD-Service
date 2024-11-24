// src/routes/queryRoutes.ts
import express from "express";
import { postQuery, answerQuery, voteQuery, voteAnswer, markAnswerAsOfficial, reportSpam, searchQuery, searchGitHub } from "../controllers/queryController";

const router = express.Router();

// Route to post a new query with tags
router.post("/queries", postQuery);

router.post("/queries/:id/answer", answerQuery);

router.post('/queries/:id/vote', voteQuery);

router.post('/answers/:answerId/vote', voteAnswer);

router.post('/answers/:answerId/markOfficial', markAnswerAsOfficial);

router.post('/queries/:id/reportSpam', reportSpam);

// Route for search functionality
router.get('/search', searchQuery);

// For searching codebase files
router.get('/search/github', searchGitHub);

export default router;

