import { Request, Response } from 'express';
import prisma from '../prisma';
import client from '../services/elasticSearch'; // Your ElasticSearch client
import { PostQueryInput, AnswerQueryInput } from '../types/queryTypes';
import { publishEvent } from "../services/rabbitmq";
import { generateAIResponse } from '../services/aiService';

export const postQuery = async (req: Request, res: Response) => {
  const { content, tags, creatorId }: PostQueryInput = req.body;

  try {
    const query = await prisma.query.create({
      data: {
        content,
        creatorId, // The user who created the query
        tags: {
          connectOrCreate: tags.map((tag) => ({
            where: { name: tag },
            create: { name: tag },
          })),
        },
      },
      include: { tags: true },
    });

    // Index the query in Elasticsearch
    await client.index({
      index: 'queries',
      id: query.id.toString(),
      document: {
        content: query.content,
        tags: query.tags.map(tag => tag.name),
        createdAt: query.createdAt,
      },
    });

    const event = {
      eventType: "QueryCreated",
      data: {
        queryId: query.id,
        content: query.content,
        tags: query.tags.map(tag => tag.name),
        creatorId: query.creatorId,
        createdAt: query.createdAt,
      },
    };
    await publishEvent(event);

    // Update QueryAnalytics
    const dateKey = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const today = new Date(dateKey);

    await Promise.all(
      query.tags.map(async (tag) => {
        // Upsert QueryAnalytics for the tag
        const queryAnalytics = await prisma.queryAnalytics.upsert({
          where: { tagName: tag.name },
          update: { queryCount: { increment: 1 } },
          create: {
            tagName: tag.name,
            queryCount: 1, // Initial query count for a new tag
          },
        });

        // Ensure the `queryAnalytics.id` is correctly used in DailyData
        await prisma.dailyData.upsert({
          where: {
            date_queryAnalyticsId: {
              date: today, // Ensure `today` is formatted as YYYY-MM-DD
              queryAnalyticsId: queryAnalytics.id,
            },
          },
          update: {
            queries: { increment: 1 }, // Increment query count for today
          },
          create: {
            date: today,
            queries: 1, // Initial query count for the new date
            answers: 0, // Initialize answers count
            queryAnalyticsId: queryAnalytics.id,
          },
        });
      })
    );

    res.status(201).json(query);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error posting query" });
  }
};

export const answerQuery = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { content, answerCreatorId }: AnswerQueryInput = req.body;

  try {
    const answer = await prisma.answer.create({
      data: {
        content,
        queryId: parseInt(id),
        answerCreatorId,
      },
    });

    // Increment the answersCount for the query
    const query = await prisma.query.update({
      where: { id: parseInt(id) },
      data: {
        answersCount: { increment: 1 },
      },
      include: { tags: true }, // Include tags for analytics
    });

    // Update Elasticsearch index to reflect new answersCount and priority
    await client.update({
      index: 'queries',
      id: id.toString(),
      doc: {
        answers_count: query.answersCount,
        priority: 2 * query.answersCount + query.upvotesCount - query.downvotesCount,
      },
    });

    // Publish an event to RabbitMQ
    const event = {
      eventType: "AnswerCreated",
      data: {
        answerId: answer.id,
        content: answer.content,
        queryId: answer.queryId,
        answerCreatorId: answer.answerCreatorId,
        createdAt: answer.createdAt,
      },
    };
    await publishEvent(event);

    // Update QueryAnalytics
    const dateKey = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const today = new Date(dateKey);

    await Promise.all(
      query.tags.map(async (tag) => {
        const queryAnalytics = await prisma.queryAnalytics.upsert({
          where: { tagName: tag.name },
          update: { answerCount: { increment: 1 } },
          create: { tagName: tag.name },
        });

        await prisma.dailyData.upsert({
          where: {
            date_queryAnalyticsId: {
              date: today,
              queryAnalyticsId: queryAnalytics.id,
            },
          },
          update: { answers: { increment: 1 } },
          create: {
            date: today,
            queries: 0,
            answers: 1,
            queryAnalyticsId: queryAnalytics.id,
          },
        });
      })
    );


    res.status(201).json(answer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error answering query" });
  }
};

export const voteQuery = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId, type } = req.body; // type: 'UPVOTE' or 'DOWNVOTE'

  try {
    // Ensure user can only vote once per query
    const existingVote = await prisma.queryVote.findFirst({
      where: {
        queryId: parseInt(id),
        userId,
      },
    });

    if (existingVote) {
      res.status(400).json({ error: "You have already voted on this query" });
      return;
    }

    const vote = await prisma.queryVote.create({
      data: {
        queryId: parseInt(id),
        userId,
        type,
      },
    });

    // Update query vote counts
    const query = await prisma.query.update({
      where: { id: parseInt(id) },
      data: {
        upvotesCount: { increment: type === 'UPVOTE' ? 1 : 0 },
        downvotesCount: { increment: type === 'DOWNVOTE' ? 1 : 0 },
      },
    });

    // Update Elasticsearch index
    await client.update({
      index: 'queries',
      id: id.toString(),
      doc: {
        upvotes: query.upvotesCount,
        downvotes: query.downvotesCount,
        priority: 2 * query.answersCount + query.upvotesCount - query.downvotesCount,
      },
    });

    res.status(201).json({ vote, query });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error voting on query" });
  }
};

export const voteAnswer = async (req: Request, res: Response) => {
  const { answerId } = req.params;
  const { userId, type, queryId } = req.body; // type: 'UPVOTE' or 'DOWNVOTE'

  try {
    // Ensure user can only vote once per query
    const existingVote = await prisma.answerVote.findFirst({
      where: {
        answerId: parseInt(answerId),
        userId,
      },
    });

    if (existingVote) {
      res.status(400).json({ error: "You have already voted on this answer" });
      return;
    }

    const vote = await prisma.answerVote.create({
      data: {
        answerId: parseInt(answerId),
        userId,
        type,
      },
    });

    // Update query vote counts
    const query = await prisma.answer.update({
      where: { id: parseInt(answerId) },
      data: {
        upvotesCount: { increment: type === 'UPVOTE' ? 1 : 0 },
        downvotesCount: { increment: type === 'DOWNVOTE' ? 1 : 0 },
      },
    });

    // Update Elasticsearch index
    await client.update({
      index: 'queries',
      id: queryId.toString(),
      script: {
        source: `
          if (ctx._source.priority == null) {
            ctx._source.priority = params.increment;
          } else {
            ctx._source.priority += params.increment;
          }
        `,
        params: {
          increment: 2,
        },
      },
    });

    res.status(201).json({ vote, query });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error voting on query" });
  }
};

export const reportSpam = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId }: { userId: number } = req.body;

  try {
    const query = await prisma.query.update({
      where: { id: parseInt(id) },
      data: {
        reportedBy: {
          connect: { id: userId },
        },
      },
    });

    res.status(200).json(query);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error reporting spam" });
  }
};

export const searchQuery = async (req: Request, res: Response) => {
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

    // Step 4: Generate AI response based on query results
    let aiResponse;
    if (queriesWithAnswers.some((q) => q.answers.length > 0)) {
      aiResponse = await generateAIResponse(search as string, queriesWithAnswers);
    } else {
      aiResponse = "Not enough data for a detailed response. Please refine your search.";
    }

    // Step 5: Return the response with both query results and codebase results
    res.status(200).json({
      results: {
        queries: queriesWithAnswers,
      },
      aiSuggestion: aiResponse,
    });
  } catch (error) {
    console.error("Error performing search:", error);
    res.status(500).json({ error: "Error performing search" });
  }
};

export const searchGitHub = async (req: Request, res: Response) => {
  const { search } = req.query;
  const K = 3; // Number of top results to return

  try {
    if (!search) {
      res.status(400).json({ error: "Search term is required" });
      return;
    }

    // Search Elasticsearch for codebase files (project files)
    const esCodebaseResult = await client.search({
      index: 'codebase-index',
      query: {
        multi_match: {
          query: search as string,
          fields: ["content", "file_path", "project_name^2"],
        },
      },
      size: K, // Top K hits
    });

    // Extract codebase file results
    const codebaseHits = esCodebaseResult.hits.hits.map((hit: any) => ({
      filename: hit._source.filename,
      file_path: hit._source.file_path,
      project_name: hit._source.project_name,
      github_url: hit._source.github_url,
      content_highlight: hit.highlight?.content?.[0] || null, // If highlighted content exists
    }));

    res.status(200).json({
      results: codebaseHits,
    });
  } catch (error) {
    console.error("Error performing GitHub search:", error);
    res.status(500).json({ error: "Error performing GitHub search" });
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
