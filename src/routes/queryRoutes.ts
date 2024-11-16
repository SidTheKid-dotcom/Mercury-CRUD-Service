// src/routes/queryRoutes.ts
import express from "express";
import { postQuery, answerQuery, voteQuery, reportSpam, getFeed, searchQuery } from "../controllers/queryController";

const router = express.Router();

// Route to post a new query with tags
router.post("/queries", postQuery);

router.post("/queries/:id/answer", answerQuery);

router.post('/queries/:id/vote', voteQuery);

router.post('/queries/:id/reportSpam', reportSpam);

// Route for search functionality
router.get('/search', searchQuery);

// Route to get feed, optionally filtered by tag
router.get("/queries", getFeed);

export default router;

