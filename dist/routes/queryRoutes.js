"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/queryRoutes.ts
const express_1 = __importDefault(require("express"));
const queryController_1 = require("../controllers/queryController");
const router = express_1.default.Router();
// Route to post a new query with tags
router.post("/queries", queryController_1.postQuery);
// Route for search functionality
router.get('/search', queryController_1.searchQuery);
// Route to answer a specific query
router.post("/queries/:id/answer", queryController_1.answerQuery);
// Route to get feed, optionally filtered by tag
router.get("/queries", queryController_1.getFeed);
exports.default = router;
