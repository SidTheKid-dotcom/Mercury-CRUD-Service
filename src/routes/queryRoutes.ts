import express from "express";
import { postQuery, answerQuery, getFeed } from "../controllers/queryController";

const router = express.Router();

// Route to post a new query with tags
router.post("/queries", postQuery);

// Route to answer a specific query
router.post("/queries/:id/answer", answerQuery);

// Route to get feed, optionally filtered by tag
router.get("/queries", getFeed);

export default router;
