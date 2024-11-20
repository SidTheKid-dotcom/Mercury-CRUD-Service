"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userRoutes_1 = __importDefault(require("./userRoutes")); // Import user-related routes
const queryRoutes_1 = __importDefault(require("./queryRoutes")); // Import query-related routes
const folderRoute_1 = __importDefault(require("./folderRoute"));
const analyticsRoute_1 = __importDefault(require("./analyticsRoute"));
const router = (0, express_1.Router)();
// Route for user-related endpoints
router.use('/user', userRoutes_1.default);
// Route for query-related endpoints
router.use('/query', queryRoutes_1.default);
// Route for folder-upload endpoint
router.use('/upload', folderRoute_1.default);
// Route for analytics endpoint
router.use('/analytics', analyticsRoute_1.default);
exports.default = router;
