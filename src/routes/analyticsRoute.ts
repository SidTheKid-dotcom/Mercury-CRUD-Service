import express from "express";
import { getAnalytics } from "../controllers/analyticsController";

const router = express.Router();

// Route to handle folder uploads
router.get("/", getAnalytics);

export default router;
