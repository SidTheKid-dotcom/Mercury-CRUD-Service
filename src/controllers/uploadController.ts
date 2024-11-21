import { Request, Response } from "express";
import fs from "fs-extra";
import path from "path";
import AdmZip from "adm-zip";
import prisma from "../prisma";
import { uploadToS3, storeFileLinkInDb } from "../services/s3Service";
import { fetchRecursiveStructure } from "../services/githubUrlService";
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

// Controller function to handle file upload
export const uploadFile = async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).send('No file uploaded');
    return;
  }

  const { buffer, originalname } = req.file;
  const bucketName = process.env.AWS_BUCKET_NAME;

  try {
    // Upload file to S3
    const fileUrl = await uploadToS3(buffer, originalname, bucketName);

    // Store file URL in PostgreSQL using Prisma
    const file = await storeFileLinkInDb(originalname, fileUrl);

    // Return the URL of the uploaded file as a response
    res.status(200).json({
      message: 'File uploaded successfully',
      fileUrl: file.fileUrl, // Return the file URL from the DB
    });
  } catch (err) {
    res.status(500).send('Error uploading file');
  }
};

export const uploadGithubUrl = async (req: Request, res: Response) => {
  const { repoUrl } = req.body; // URL of the GitHub repository

  try {
    // Extract owner and repo name from the URL
    const regex = /https:\/\/github\.com\/([^\/]+)\/([^\/]+)/;
    const match = repoUrl.match(regex);
    if (!match) {
      res.status(400).json({ message: 'Invalid GitHub URL' });
      return;
    }

    const owner = match[1];
    const repoName = match[2];

    // Fetch the repository structure
    const fileStructure = await fetchRecursiveStructure(owner, repoName);

    // Save the repository structure in the database
    const result = await prisma.repositoryStructure.create({
      data: {
        repoUrl,
        owner,
        repoName,
        structure: fileStructure,
      },
    });

    res.status(200).json({
      message: 'Repository structure stored successfully',
      data: result,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error storing repository structure', error });
  }
};