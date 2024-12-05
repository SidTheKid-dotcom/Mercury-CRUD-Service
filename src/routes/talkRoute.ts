// src/routes/queryRoutes.ts
import express from "express";
import { talkDocs, talkCSV, talkRepo, visualizeCSV } from "../controllers/talkController";

const router = express.Router();

// Route for talk with docs
router.post('/docs', talkDocs);

// Route for talk with csv
router.post('/csv', talkCSV);

// Route for visualize csv
router.post('/csv/visualize', visualizeCSV);

// Route for talk with repo
router.post('/repo/:repoId', talkRepo);

export default router;

