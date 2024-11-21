const axios = require('axios');
const fs = require('fs');
import prisma from "../prisma";

const GITHUB_API_URL = 'https://api.github.com/repos/';

// Function to fetch the repository structure recursively
export const fetchRecursiveStructure = async (owner: string, repo: string, path = '') => {
    try {
        const response = await axios.get(`${GITHUB_API_URL}${owner}/${repo}/contents/${path}`);
        const structure = await Promise.all(response.data.map(async (item: any) => {
            if (item.type === 'dir') {
                // Recursively fetch contents for directories
                item.contents = await fetchRecursiveStructure(owner, repo, item.path);
            }
            return item;
        }));
        return structure;
    } catch (error) {
        console.error('Error fetching file structure:', error);
        throw error;
    }
};