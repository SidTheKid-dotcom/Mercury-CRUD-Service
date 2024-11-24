// src/routes/queryRoutes.ts
import express from "express";
import { talkDocs, talkRepo } from "../controllers/talkController";

const router = express.Router();

// Route for talk with docs
router.post('/docs', talkDocs);

// Route for talk with repo
router.post('/repo/:repoId', talkRepo);

export default router;

