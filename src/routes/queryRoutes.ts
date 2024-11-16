// src/routes/queryRoutes.ts
import express from "express";
import { postQuery, answerQuery, getFeed, searchQuery } from "../controllers/queryController";

const router = express.Router();

// Route to post a new query with tags
router.post("/queries", postQuery);

// Route for search functionality
router.get('/search', searchQuery);

// Route to answer a specific query
router.post("/queries/:id/answer", answerQuery);

// Route to get feed, optionally filtered by tag
router.get("/queries", getFeed);

export default router;
