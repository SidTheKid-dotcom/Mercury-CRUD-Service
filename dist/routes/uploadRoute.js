"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const uploadController_1 = require("../controllers/uploadController");
const router = express_1.default.Router();
const uploadFolderMulter = (0, multer_1.default)({ dest: "uploads/" }); // Temporary folder for uploads
// Memory storage so that the file will be stored in memory as a buffer before upload
const storage = multer_1.default.memoryStorage();
// Multer configuration
const uploadFileMulter = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Set file size limit (10MB in this case)
});
// Route to handle folder uploads
router.post("/folder", uploadFolderMulter.single("codebase"), uploadController_1.uploadFolder);
// Router to handle file uploads
router.post('/file', uploadFileMulter.single('file'), uploadController_1.uploadFile);
// Route to handle github url uploads
router.post('/github', uploadController_1.uploadGithubUrl);
exports.default = router;
