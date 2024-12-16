import { Request, Response } from 'express';
import prisma from '../prisma';
import client from '../services/elasticSearch'; // Your ElasticSearch client
import { PostQueryInput, AnswerQueryInput } from '../types/queryTypes';
import { publishEvent } from "../services/rabbitmq";
import { generateAIResponse } from '../services/aiService';
import { uploadToS3 } from "../services/s3Service";
import { extractImageTags } from "../services/aiService";
import axios from 'axios';

export const postQuery = async (req: Request, res: Response) => {
  const { content, tags, creatorId }: PostQueryInput = req.body;

  try {
    /* const response: any = await axios.post('http://52.66.210.49:8000/classify', {
      "query": content
    });

    if (!response.data) {
      res.status(500).json({ error: 'Spam Detection Failed' });
      return;
    }

    if (response.data.result === false) {
      res.status(500).json({ error: 'Spam Detected' });
      return;
    } */

    const { buffer, originalname } = req.file ? req.file : { buffer: null, originalname: null };
    const bucketName = process.env.AWS_BUCKET_NAME;

    try {
      // Step 1: Upload Image to S3
      const imageUrl = buffer ? await uploadToS3(buffer, originalname, bucketName) : '';

      // Step 2: Extract Image Tags from Gemini
      const imageTags = originalname ? await extractImageTags(imageUrl.split('/').pop()) : [];

      // Step 3: Combine the existing tags and the new image tags
      const allTags = Array.from(new Set([...tags, ...imageTags]));

      const query = await prisma.query.create({
        data: {
          content,
          creatorId: parseInt(creatorId, 10), // The user who created the query
          imageUrl: imageUrl ? `${process.env.CLOUDFRONT_URL}/${imageUrl.split('/').pop()}` : '',
          tags: {
            connectOrCreate: allTags.map((tag) => ({
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
          imageUrl: query.imageUrl,
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
          imageUrl: query.imageUrl
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
  }
  catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error for Spam Detection' });
    return;
  }
};

export const answerQuery = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { content, answerCreatorId }: AnswerQueryInput = req.body;

  try {

    // Fetch the designation of the answer creator
    const user = await prisma.user.findUnique({
      where: { id: answerCreatorId },
      select: { designation: true },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Determine if the answer should be marked as official
    const isOfficial = ["manager", "HOD"].includes(user.designation);

    const answer = await prisma.answer.create({
      data: {
        content,
        queryId: parseInt(id),
        answerCreatorId,
        isOfficial, // Set the isOfficial flag
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
        isOfficial: answer.isOfficial,
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

export const markAnswerAsOfficial = async (req: Request, res: Response) => {
  const { answerId } = req.params;
  const { userId } = req.body; // ID of the user attempting to mark the answer as official

  try {
    // Fetch the user's designation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { designation: true },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Check if the user is authorized to mark an answer as official
    if (!["manager", "HOD"].includes(user.designation)) {
      res.status(403).json({ error: "You are not authorized to mark this answer as official" });
      return;
    }

    // Update the answer to mark it as official
    const updatedAnswer = await prisma.answer.update({
      where: { id: parseInt(answerId) },
      data: { isOfficial: true },
    });

    // Optionally, you can publish an event for this update (e.g., for analytics or notifications)
    const event = {
      eventType: "AnswerMarkedAsOfficial",
      data: {
        answerId: updatedAnswer.id,
        queryId: updatedAnswer.queryId,
        markedBy: userId,
        markedAt: new Date().toISOString(),
      },
    };
    await publishEvent(event);

    res.status(200).json({ message: "Answer marked as official", answer: updatedAnswer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error marking answer as official" });
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
  const { search: rawSearch, tag } = req.query;
  let search = rawSearch as string;
  const K = 3; // Number of top results to return

  try {
    if (!search && !tag && !req.file) {
      res.status(400).json({ error: "No search term, tag or file provided" });
      return;
    }

    // Optimize to only search by image if any content of the query is missing
    if (!search && !tag) {

      const { buffer, originalname } = req.file ? req.file : { buffer: null, originalname: null };
      const bucketName = process.env.AWS_BUCKET_NAME;

      // Step 1: Upload Image to S3
      const imageUrl = buffer ? await uploadToS3(buffer, originalname, bucketName) : '';

      // Step 2: Extract Image Tags from Gemini
      const extractedTags = originalname ? await extractImageTags(imageUrl.split('/').pop()) : [];

      search = extractedTags.join("");
    }

    // Step 1: Search Elasticsearch for relevant queries (user queries)
    const esQueryResult = await client.search({
      index: 'queries',
      query: {
        function_score: {
          query: {
            bool: {
              should: [
                {
                  match: {
                    content: {
                      query: search as string,
                      fuzziness: 'AUTO',
                    },
                  },
                },
                {
                  match: {
                    tags: {
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
      imageUrl: hit._source.imageUrl,
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

// Get a single query by ID
export const getQueryById = async (req: Request, res: Response) => {
  const { id } = req.params; // Get query ID from the request parameters

  try {
    // Fetch the query with all related details
    const query = await prisma.query.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            designation: true,
            department: {
              select: {
                name: true,
              },
            },
          },
        },
        tags: true,
        votes: true,
        answers: {
          include: {
            answerCreator: {
              select: {
                id: true,
                email: true,
                designation: true,
              },
            },
          },
        },
      },
    });

    // If the query does not exist, return an error
    if (!query) {
      res.status(404).json({ error: "Query not found" });
      return;
    }

    // Return the query data
    res.status(200).json(query);
  } catch (error) {
    console.error("Error fetching query by ID:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
