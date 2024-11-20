import { Request, Response } from "express";
import fs from "fs-extra";
import path from "path";
import AdmZip from "adm-zip";
import { indexCodebase } from "../services/folderTraverse"; // Import the indexCodebase function

/**
 * Handles folder upload and indexing.
 * - Extracts the zip file.
 * - Calls the `indexCodebase` function with the extracted folder.
 */
export const uploadFolder = async (req: Request, res: Response) => {
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
        const extractedFolderPath = path.join(
            "extracted",
            path.basename(uploadedFilePath, ".zip")
        );

        // Create the extraction directory
        await fs.ensureDir(extractedFolderPath);

        // Extract the zip file
        const zip = new AdmZip(uploadedFilePath);
        zip.extractAllTo(extractedFolderPath, true);

        // Call the indexCodebase function to process files
        await indexCodebase(extractedFolderPath, githubRepoUrl);

        // Clean up uploaded and extracted files
        await fs.remove(uploadedFilePath);
        await fs.remove(extractedFolderPath);

        res.status(200).send("Codebase indexed successfully!");
    } catch (error) {
        console.error("Error processing upload:", error);
        res.status(500).send("An error occurred while processing the file.");
    }
};
