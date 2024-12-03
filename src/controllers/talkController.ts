import { Request, Response } from 'express';
import prisma from '../prisma';
import axios from 'axios';

export const talkDocs = async (req: Request, res: Response) => {
    const { query } = req.query; // Retrieving the query parameter from the request

    try {
        if (!query) {
            res.status(400).json({ error: "Query parameter is required" });
            return;
        }

        // Make a POST request to the external API
        const externalResponse = await axios.post(
            'http://13.127.171.237:8000/query-document',
            null, // No body content for the POST request, just query params in the URL
            {
                params: { query: query }
            }
        );

        // Extract the answer from the response
        const { answer } = externalResponse.data;

        // Send the answer back to the client
        res.json({ answer });
    } catch (error) {
        console.error('Error retrieving query document:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const talkRepo = async (req: Request, res: Response) => {
    const repoId = parseInt(req.params.repoId, 10);
    const { query } = req.body;

    // Validate repoId
    if (isNaN(repoId)) {
        res.status(400).json({ error: "Invalid repository ID" });
        return;
    }

    try {
        // Retrieve repository structure from the database
        const repo = await prisma.repositoryStructure.findUnique({
            where: { id: repoId },
        });

        if (!repo) {
            res.status(404).json({ error: "Repository not found" });
            return;
        }

        // Prepare the payload for the API request
        const payload = {
            query: query,
            repo: {
                id: repo.id,
                repoUrl: repo.repoUrl,
                owner: repo.owner,
                repoName: repo.repoName,
                description: repo.description,
                structure: repo.structure,
                createdAt: repo.createdAt,
            },
        };

        // Send a POST request to the external API
        const response = await axios.post(
            'http://13.127.171.237:8000/search_and_answer',
            payload
        );

        // Handle the API response and send it back to the client
        res.json(response.data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('API Error:', error.response?.data || error.message);
            res.status(500).json({ error: error.response?.data || 'External API Error' });
        } else {
            console.error('Unexpected Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};
