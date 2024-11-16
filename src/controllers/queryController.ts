// src/controllers/queryController.ts
import { Request, Response } from "express";
import prisma from "../prisma";
import client from "../elasticSearch";
import { PostQueryInput, AnswerQueryInput } from "../types/queryTypes";

export const postQuery = async (req: Request, res: Response) => {
  const { content, tags }: PostQueryInput = req.body; // Accept tags as an array of strings
  try {
    const query = await prisma.query.create({
      data: {
        content,
        tags: {
          connectOrCreate: tags.map((tag) => ({
            where: { name: tag },
            create: { name: tag },
          })),
        },
      },
      include: { tags: true },
    });

    // Index the new query into Elasticsearch
    await client.index({
      index: 'queries',
      id: query.id.toString(), // Use the query ID as the document ID
      document: {
        content: query.content,
        tags: query.tags.map(tag => tag.name),
        createdAt: query.createdAt,
      },
    });

    res.status(201).json(query);
  } catch (error) {
    console.error('Error indexing query:', error);
    res.status(500).json({ error: "Error posting query" });
  }
};

export const searchQuery = async (req: Request, res: Response) => {
  const { search, tag } = req.query; // Accept search term and optional tag filter
  try {
    if (!search) {
      res.status(400).json({ error: "Search term is required" });
      return;
    }

    // Search using Elasticsearch
    const esResult = await client.search({
      index: 'queries',
      query: {
        bool: {
          must: [
            {
              match: {
                content: {
                  query: search as string,
                  fuzziness: 'AUTO', // Allows for typo tolerance
                },
              },
            },
          ],
          filter: tag
            ? [
                {
                  term: {
                    tags: tag as string,
                  },
                },
              ]
            : [],
        },
      },
    });

    // Extract and format search hits
    const hits = esResult.hits.hits.map((hit: any) => hit._source);
    res.status(200).json(hits);
  } catch (error) {
    console.error('Error performing search:', error);
    res.status(500).json({ error: "Error performing search" });
  }
};


// POST /queries/:id/answer - Answer a specific query
export const answerQuery = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { content }: AnswerQueryInput = req.body;
  try {
    const answer = await prisma.answer.create({
      data: {
        content,
        queryId: parseInt(id),
      },
    });
    res.status(201).json(answer);
  } catch (error) {
    res.status(500).json({ error: "Error answering query" });
  }
};

// GET /queries - Get all queries (feed)
export const getFeed = async (req: Request, res: Response) => {
    const { tag } = req.query; // Optional tag filter
    console.log(tag);
    try {
        const queries = await prisma.query.findMany({
            where: tag
                ? {
                    tags: {
                        some: { name: tag as string },
                    },
                }
                : undefined,
            include: {
                answers: true,
                tags: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        res.status(200).json(queries);
    } catch (error) {
        res.status(500).json({ error: "Error retrieving feed" });
    }
};
