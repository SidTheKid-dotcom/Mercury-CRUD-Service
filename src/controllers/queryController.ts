// src/controllers/queryController.ts
import { Request, Response } from "express";
import prisma from "../prisma";
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
    res.status(201).json(query);
  } catch (error) {
    res.status(500).json({ error: "Error posting query" });
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
