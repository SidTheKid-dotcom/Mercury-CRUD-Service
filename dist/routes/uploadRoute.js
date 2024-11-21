"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const multer_s3_1 = __importDefault(require("multer-s3"));
const s3Service_1 = __importDefault(require("../services/s3Service"));
const uploadController_1 = require("../controllers/uploadController");
const router = express_1.default.Router();
const uploadFolderMulter = (0, multer_1.default)({ dest: "uploads/" }); // Temporary folder for uploads
const uploadFileMulter = (0, multer_1.default)({
    storage: (0, multer_s3_1.default)({
        s3: s3Service_1.default,
        bucket: process.env.AWS_BUCKET_NAME || 'default-bucket', // Fallback to avoid runtime errors
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req, file, cb) => {
            const fileName = `${Date.now()}-${file.originalname}`;
            cb(null, fileName); // Set the file name in S3
        },
    }),
});
// Route to handle folder uploads
router.post("/folder", uploadFolderMulter.single("codebase"), uploadController_1.uploadFolder);
// Router to handle file uploads
router.post('/file', uploadFileMulter.single('file'), uploadController_1.uploadFile);
exports.default = router;
