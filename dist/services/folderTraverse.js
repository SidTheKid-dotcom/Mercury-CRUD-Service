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
exports.indexCodebase = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const elasticSearch_1 = __importDefault(require("./elasticSearch"));
/**
 * Recursively traverses a directory to process and index all files.
 * @param dirPath The folder path to traverse.
 * @param projectName The project name for metadata.
 * @param githubRepoUrl The base GitHub repository URL for file links.
 */
const traverseDirectory = (dirPath, githubRepoUrl, folderPath // The root of the extracted folder
) => __awaiter(void 0, void 0, void 0, function* () {
    const entries = yield fs_extra_1.default.readdir(dirPath);
    for (const entry of entries) {
        const fullPath = path_1.default.join(dirPath, entry);
        const stat = yield fs_extra_1.default.stat(fullPath);
        if (stat.isDirectory()) {
            // Recursively process subdirectories
            yield traverseDirectory(fullPath, githubRepoUrl, folderPath);
        }
        else {
            // Process individual files
            yield processFile(fullPath, githubRepoUrl, folderPath);
        }
    }
});
/**
 * Processes a file to extract metadata and index its content into ElasticSearch.
 * @param filePath Full file path of the file to process.
 * @param projectName The project name for metadata.
 * @param githubRepoUrl The base GitHub repository URL for file links.
 */
const processFile = (filePath, githubRepoUrl, // Base GitHub URL, e.g., https://github.com/org/repo
folderPath // The root of the extracted folder
) => __awaiter(void 0, void 0, void 0, function* () {
    const fileContent = yield fs_extra_1.default.readFile(filePath, "utf8");
    // Generate the relative path for the file
    const relativePath = path_1.default.relative(folderPath, filePath);
    // Extract file extension and file name
    const fileType = path_1.default.extname(filePath).substring(1); // Extract file extension
    const fileName = path_1.default.basename(filePath);
    // Correctly generate the GitHub URL using the relative path
    const githubUrl = `${githubRepoUrl}/blob/main/${relativePath.replace(/\\/g, "/")}`;
    // Index the file content into ElasticSearch
    yield elasticSearch_1.default.index({
        index: "codebase-index",
        body: {
            filename: fileName,
            file_path: relativePath,
            content: fileContent,
            file_type: fileType,
            github_url: githubUrl,
            timestamp: new Date().toISOString(),
        },
    });
    console.log(`Indexed: ${relativePath}`);
});
/**
 * Main function to index a codebase.
 * @param folderPath Path to the root of the codebase folder.
 * @param projectName Name of the project.
 * @param githubRepoUrl GitHub repository base URL.
 */
const indexCodebase = (folderPath, githubRepoUrl) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Starting to index codebase: ${githubRepoUrl}`);
    // Check if the extracted folder contains a single directory
    const entries = yield fs_extra_1.default.readdir(folderPath);
    let effectiveRoot = folderPath;
    if (entries.length === 1) {
        const singleEntryPath = path_1.default.join(folderPath, entries[0]);
        const stat = yield fs_extra_1.default.stat(singleEntryPath);
        if (stat.isDirectory()) {
            // If the single entry is a directory, use it as the root
            effectiveRoot = singleEntryPath;
        }
    }
    yield traverseDirectory(effectiveRoot, githubRepoUrl, effectiveRoot);
    console.log("Indexing complete!");
});
exports.indexCodebase = indexCodebase;
