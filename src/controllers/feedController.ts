import { Request, Response } from 'express';
import prisma from '../prisma';
import client from '../services/elasticSearch'; // Your ElasticSearch client
import { PostQueryInput, AnswerQueryInput } from '../types/queryTypes';
import { publishEvent } from "../services/rabbitmq";
import { generateAIResponse } from '../services/aiService';

// GET / - Get all queries (feed)
export const getFeed = async (req: Request, res: Response) => {
    const { tag } = req.query; // Optional tag filter
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

// Function to get trending posts
export const getTrendingPosts = async (req: Request, res: Response) => {
    const K = 10; // Number of top posts to return

    try {
        // Step 1: Query Elasticsearch for top posts based on priority
        const esQueryResult = await client.search({
            index: "queries",
            query: {
                function_score: {
                    query: {
                        match_all: {}, // Fetch all posts
                    },
                    field_value_factor: {
                        field: "priority",
                        factor: 1.0,
                        modifier: "log1p", // Apply log1p transformation
                        missing: 0, // Default value if `priority` is missing
                    },
                },
            },
            size: K, // Limit to top K results
            sort: [{ priority: { order: "desc" } }], // Sort by priority descending
        });

        // Extract the relevant data from Elasticsearch results
        const postHits = esQueryResult.hits.hits.map((hit: any) => ({
            postId: parseInt(hit._id, 10), // Ensure postId is a number
            title: hit._source.title,
            content: hit._source.content,
            priority: hit._source.priority,
        }));

        // Step 2: Fetch all answers for the top posts in one query
        const postIds = postHits.map((post: any) => post.postId);

        const answers = await prisma.answer.findMany({
            where: {
                queryId: { in: postIds },
            },
            select: {
                queryId: true, // To group answers by their associated post
                content: true,
                createdAt: true,
                answerCreator: {
                    select: {
                        email: true,
                    },
                },
            },
        });

        // Step 3: Group answers by queryId (postId)
        const answersByQueryId = answers.reduce((acc, answer) => {
            if (!acc[answer.queryId]) {
                acc[answer.queryId] = [];
            }
            acc[answer.queryId].push({
                content: answer.content,
                createdAt: answer.createdAt,
                creatorName: answer.answerCreator.email,
            });
            return acc;
        }, {} as Record<number, any[]>);

        // Step 4: Combine posts with their respective answers
        const detailedPosts = postHits.map((post: any) => ({
            ...post,
            answers: answersByQueryId[post.postId] || [], // Include answers or empty array if none
        }));

        // Step 5: Return the enriched response
        res.status(200).json({
            success: true,
            posts: detailedPosts,
        });
    } catch (error) {
        console.error("Error fetching trending posts:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching trending posts",
        });
    }
};

// Controller to search feed
export const searchFeed = async (req: Request, res: Response) => {
    const { search, tag } = req.query;
    const K = 3; // Number of top results to return

    try {
        if (!search) {
            res.status(400).json({ error: "Search term is required" });
            return;
        }

        // Step 1: Search Elasticsearch for relevant queries (user queries)
        const esQueryResult = await client.search({
            index: 'queries',
            query: {
                function_score: {
                    query: {
                        bool: {
                            must: [
                                {
                                    match: {
                                        content: {
                                            query: search as string,
                                            fuzziness: 'AUTO',
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
                    field_value_factor: {
                        field: 'priority',
                        factor: 1.0,
                        modifier: 'log1p',
                        missing: 0,
                    },
                },
            },
            size: K, // Top K hits
        });

        // Extract the relevant data from query search results
        const queryHits = esQueryResult.hits.hits.map((hit: any) => ({
            queryID: parseInt(hit._id, 10),
            content: hit._source.content,
        }));

        // Step 2: Fetch answers for each query from Prisma
        const queriesWithAnswers = await Promise.all(
            queryHits.map(async (hit: any) => {
                const answers = await prisma.answer.findMany({
                    where: {
                        queryId: hit.queryID,
                    },
                    select: {
                        content: true,
                        createdAt: true,
                        answerCreator: {
                            select: {
                                email: true,
                            },
                        },
                    },
                });

                return {
                    ...hit,
                    answers: answers.map((answer) => ({
                        content: answer.content,
                        createdAt: answer.createdAt,
                        creatorName: answer.answerCreator.email,
                    })),
                };
            })
        );


        // Step 5: Return the response with both query results and codebase results
        res.status(200).json({
            results: {
                queries: queriesWithAnswers,
            }
        });
    } catch (error) {
        console.error("Error performing search:", error);
        res.status(500).json({ error: "Error performing search" });
    }
};