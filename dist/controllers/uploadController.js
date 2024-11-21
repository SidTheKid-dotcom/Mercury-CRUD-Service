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
exports.uploadGithubUrl = exports.uploadFile = exports.uploadFolder = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const adm_zip_1 = __importDefault(require("adm-zip"));
const prisma_1 = __importDefault(require("../prisma"));
const s3Service_1 = require("../services/s3Service");
const githubUrlService_1 = require("../services/githubUrlService");
const folderTraverse_1 = require("../services/folderTraverse"); // Import the indexCodebase function
/**
 * Handles folder upload and indexing.
 * - Extracts the zip file.
 * - Calls the `indexCodebase` function with the extracted folder.
 */
const uploadFolder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validate uploaded file
        if (!req.file) {
            res.status(400).send("No file uploaded.");
            return;
        }
        const { githubRepoUrl } = req.body;
        // Validate required metadata
        if (!githubRepoUrl) {
            res.status(400).send("Project name and GitHub URL are required.");
            return;
        }
        // Extract the uploaded zip file
        const uploadedFilePath = req.file.path;
        const extractedFolderPath = path_1.default.join("extracted", path_1.default.basename(uploadedFilePath, ".zip"));
        // Create the extraction directory
        yield fs_extra_1.default.ensureDir(extractedFolderPath);
        // Extract the zip file
        const zip = new adm_zip_1.default(uploadedFilePath);
        zip.extractAllTo(extractedFolderPath, true);
        // Call the indexCodebase function to process files
        yield (0, folderTraverse_1.indexCodebase)(extractedFolderPath, githubRepoUrl);
        // Clean up uploaded and extracted files
        yield fs_extra_1.default.remove(uploadedFilePath);
        yield fs_extra_1.default.remove(extractedFolderPath);
        res.status(200).send("Codebase indexed successfully!");
    }
    catch (error) {
        console.error("Error processing upload:", error);
        res.status(500).send("An error occurred while processing the file.");
    }
});
exports.uploadFolder = uploadFolder;
// Controller function to handle file upload
const uploadFile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.file) {
        res.status(400).send('No file uploaded');
        return;
    }
    const { buffer, originalname } = req.file;
    const bucketName = process.env.AWS_BUCKET_NAME;
    try {
        // Upload file to S3
        const fileUrl = yield (0, s3Service_1.uploadToS3)(buffer, originalname, bucketName);
        // Store file URL in PostgreSQL using Prisma
        const file = yield (0, s3Service_1.storeFileLinkInDb)(originalname, fileUrl);
        // Return the URL of the uploaded file as a response
        res.status(200).json({
            message: 'File uploaded successfully',
            fileUrl: file.fileUrl, // Return the file URL from the DB
        });
    }
    catch (err) {
        res.status(500).send('Error uploading file');
    }
});
exports.uploadFile = uploadFile;
const uploadGithubUrl = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { repoUrl } = req.body; // GitHub URL provided by the user
    try {
        // Validate and parse the URL to extract owner and repository name
        const regex = /https:\/\/github\.com\/([^\/]+)\/([^\/]+)/;
        const match = repoUrl.match(regex);
        if (!match) {
            res.status(400).json({ message: 'Invalid GitHub URL' });
            return;
        }
        const owner = match[1];
        const repoName = match[2];
        // Fetch repository details (description)
        const { description } = yield (0, githubUrlService_1.fetchRepoDetails)(owner, repoName);
        // Fetch the core file structure
        const fileStructure = yield (0, githubUrlService_1.fetchCoreStructure)(owner, repoName);
        // Save the repository details and structure in the database
        const result = yield prisma_1.default.repositoryStructure.create({
            data: {
                repoUrl,
                owner,
                repoName,
                description,
                structure: fileStructure,
            },
        });
        res.status(200).json({
            message: 'Repository structure stored successfully',
            data: result,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error storing repository structure', error: error });
    }
});
exports.uploadGithubUrl = uploadGithubUrl;
