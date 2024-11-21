const axios = require('axios');
const fs = require('fs');

const GITHUB_API_URL = 'https://api.github.com/repos/';

// Function to fetch the repository description and basic details
export const fetchRepoDetails = async (owner: string, repo: string) => {
    try {
      const response = await axios.get(`${GITHUB_API_URL}${owner}/${repo}`);
      return {
        description: response.data.description || 'No description provided.',
      };
    } catch (error) {
      console.error('Error fetching repository details:', error);
      throw error;
    }
  };

// Function to fetch and simplify the repository structure recursively
export const fetchCoreStructure = async (owner: string, repo: string, path = '') => {
    try {
      const response = await axios.get(`${GITHUB_API_URL}${owner}/${repo}/contents/${path}`);
      const structure = await Promise.all(response.data.map(async (item: any) => {
        if (item.type === 'dir') {
          // For directories, recursively fetch nested contents
          return {
            name: item.name,
            type: 'directory',
            contents: await fetchCoreStructure(owner, repo, item.path),
          };
        } else if (item.type === 'file') {
          // For files, return only the name and type
          return {
            name: item.name,
            type: 'file',
          };
        }
      }));
      return structure;
    } catch (error) {
      console.error('Error fetching file structure:', error);
      throw error;
    }
  };