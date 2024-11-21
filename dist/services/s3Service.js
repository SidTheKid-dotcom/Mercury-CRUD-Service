"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storeFileLinkInDb = exports.uploadToS3 = void 0;
const AWS = require('aws-sdk');
const prisma_1 = __importDefault(require("../prisma"));
// Initialize AWS S3
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Use environment variables for better security
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION, // e.g., 'us-west-2'
});
// Upload file to S3
const uploadToS3 = (fileBuffer, fileName, bucketName) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        Bucket: bucketName,
        Key: fileName, // The file will be stored with this name
        Body: fileBuffer, // The buffer from multer
        ContentType: 'application/octet-stream',
    };
    try {
        const uploadResult = yield s3.upload(params).promise();
        console.log('File uploaded successfully:', uploadResult.Location);
        return uploadResult.Location; // Return the URL of the uploaded file
    }
    catch (err) {
        console.error('Error uploading file:', err);
        throw err;
    }
});
exports.uploadToS3 = uploadToS3;
const storeFileLinkInDb = (fileName, fileUrl) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const file = yield prisma_1.default.file.create({
            data: {
                fileName,
                fileUrl,
            },
        });
        console.log('File link stored in DB with ID:', file.id);
        return file;
    }
    catch (err) {
        console.error('Error storing file link in DB:', err);
        throw err;
    }
});
exports.storeFileLinkInDb = storeFileLinkInDb;
exports.default = s3;
