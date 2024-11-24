// src/routes/queryRoutes.ts
import express from "express";
import { getFeed, getTrendingPosts, searchFeed } from "../controllers/feedController";

const router = express.Router();

// For gettting feed files
router.get('/', getFeed);

// For getting trending posts in feed
router.get('/trending', getTrendingPosts);

// For searching feed
router.get('/search', searchFeed);

export default router;