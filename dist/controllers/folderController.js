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
exports.uploadFolder = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const adm_zip_1 = __importDefault(require("adm-zip"));
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
