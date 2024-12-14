import express from "express";
import { getAnalytics, getDeptAnalytics } from "../controllers/analyticsController";

const router = express.Router();

// Route to handle folder uploads
router.get("/", getAnalytics);

router.get("/departments", getDeptAnalytics);

export default router;
