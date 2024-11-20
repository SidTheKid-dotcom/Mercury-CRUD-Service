import fs from "fs-extra";
import path from "path";
import client from './elasticSearch';

/**
 * Recursively traverses a directory to process and index all files.
 * @param dirPath The folder path to traverse.
 * @param projectName The project name for metadata.
 * @param githubRepoUrl The base GitHub repository URL for file links.
 */
const traverseDirectory = async (
    dirPath: string,
    githubRepoUrl: string,
    folderPath: string // The root of the extracted folder
): Promise<void> => {
    const entries = await fs.readdir(dirPath);

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry);
        const stat = await fs.stat(fullPath);

        if (stat.isDirectory()) {
            // Recursively process subdirectories
            await traverseDirectory(fullPath, githubRepoUrl, folderPath);
        } else {
            // Process individual files
            await processFile(fullPath, githubRepoUrl, folderPath);
        }
    }
};


/**
 * Processes a file to extract metadata and index its content into ElasticSearch.
 * @param filePath Full file path of the file to process.
 * @param projectName The project name for metadata.
 * @param githubRepoUrl The base GitHub repository URL for file links.
 */
const processFile = async (
    filePath: string,
    githubRepoUrl: string, // Base GitHub URL, e.g., https://github.com/org/repo
    folderPath: string // The root of the extracted folder
): Promise<void> => {
    const fileContent = await fs.readFile(filePath, "utf8");

    // Generate the relative path for the file
    const relativePath = path.relative(folderPath, filePath);

    // Extract file extension and file name
    const fileType = path.extname(filePath).substring(1); // Extract file extension
    const fileName = path.basename(filePath);

    // Correctly generate the GitHub URL using the relative path
    const githubUrl = `${githubRepoUrl}/blob/main/${relativePath.replace(/\\/g, "/")}`;

    // Index the file content into ElasticSearch
    await client.index({
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
};

/**
 * Main function to index a codebase.
 * @param folderPath Path to the root of the codebase folder.
 * @param projectName Name of the project.
 * @param githubRepoUrl GitHub repository base URL.
 */
const indexCodebase = async (
    folderPath: string,
    githubRepoUrl: string
): Promise<void> => {
    console.log(`Starting to index codebase: ${githubRepoUrl}`);

    // Check if the extracted folder contains a single directory
    const entries = await fs.readdir(folderPath);
    let effectiveRoot = folderPath;

    if (entries.length === 1) {
        const singleEntryPath = path.join(folderPath, entries[0]);
        const stat = await fs.stat(singleEntryPath);
        if (stat.isDirectory()) {
            // If the single entry is a directory, use it as the root
            effectiveRoot = singleEntryPath;
        }
    }

    await traverseDirectory(effectiveRoot, githubRepoUrl, effectiveRoot);

    console.log("Indexing complete!");
};



export { indexCodebase };