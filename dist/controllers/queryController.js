"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFeed = exports.searchGitHub = exports.searchQuery = exports.reportSpam = exports.voteQuery = exports.answerQuery = exports.postQuery = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const elasticSearch_1 = __importDefault(require("../services/elasticSearch")); // Your ElasticSearch client
const rabbitmq_1 = require("../services/rabbitmq");
const aiService_1 = require("../services/aiService");
const postQuery = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { content, tags, creatorId } = req.body;
    try {
        const query = yield prisma_1.default.query.create({
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
        yield elasticSearch_1.default.index({
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
        yield (0, rabbitmq_1.publishEvent)(event);
        // Update QueryAnalytics
        const dateKey = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        const today = new Date(dateKey);
        yield Promise.all(query.tags.map((tag) => __awaiter(void 0, void 0, void 0, function* () {
            // Upsert QueryAnalytics for the tag
            const queryAnalytics = yield prisma_1.default.queryAnalytics.upsert({
                where: { tagName: tag.name },
                update: { queryCount: { increment: 1 } },
                create: {
                    tagName: tag.name,
                    queryCount: 1, // Initial query count for a new tag
                },
            });
            // Ensure the `queryAnalytics.id` is correctly used in DailyData
            yield prisma_1.default.dailyData.upsert({
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
        })));
        res.status(201).json(query);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error posting query" });
    }
});
exports.postQuery = postQuery;
const answerQuery = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { content, answerCreatorId } = req.body;
    try {
        const answer = yield prisma_1.default.answer.create({
            data: {
                content,
                queryId: parseInt(id),
                answerCreatorId,
            },
        });
        // Increment the answersCount for the query
        const query = yield prisma_1.default.query.update({
            where: { id: parseInt(id) },
            data: {
                answersCount: { increment: 1 },
            },
            include: { tags: true }, // Include tags for analytics
        });
        // Update Elasticsearch index to reflect new answersCount and priority
        yield elasticSearch_1.default.update({
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
        yield (0, rabbitmq_1.publishEvent)(event);
        // Update QueryAnalytics
        const dateKey = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        const today = new Date(dateKey);
        yield Promise.all(query.tags.map((tag) => __awaiter(void 0, void 0, void 0, function* () {
            const queryAnalytics = yield prisma_1.default.queryAnalytics.upsert({
                where: { tagName: tag.name },
                update: { answerCount: { increment: 1 } },
                create: { tagName: tag.name },
            });
            yield prisma_1.default.dailyData.upsert({
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
        })));
        res.status(201).json(answer);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error answering query" });
    }
});
exports.answerQuery = answerQuery;
const voteQuery = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { userId, type } = req.body; // type: 'UPVOTE' or 'DOWNVOTE'
    try {
        // Ensure user can only vote once per query
        const existingVote = yield prisma_1.default.queryVote.findFirst({
            where: {
                queryId: parseInt(id),
                userId,
            },
        });
        if (existingVote) {
            res.status(400).json({ error: "You have already voted on this query" });
            return;
        }
        const vote = yield prisma_1.default.queryVote.create({
            data: {
                queryId: parseInt(id),
                userId,
                type,
            },
        });
        // Update query vote counts
        const query = yield prisma_1.default.query.update({
            where: { id: parseInt(id) },
            data: {
                upvotesCount: { increment: type === 'UPVOTE' ? 1 : 0 },
                downvotesCount: { increment: type === 'DOWNVOTE' ? 1 : 0 },
            },
        });
        // Update Elasticsearch index
        yield elasticSearch_1.default.update({
            index: 'queries',
            id: id.toString(),
            doc: {
                upvotes: query.upvotesCount,
                downvotes: query.downvotesCount,
                priority: 2 * query.answersCount + query.upvotesCount - query.downvotesCount,
            },
        });
        res.status(201).json({ vote, query });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error voting on query" });
    }
});
exports.voteQuery = voteQuery;
const reportSpam = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { userId } = req.body;
    try {
        const query = yield prisma_1.default.query.update({
            where: { id: parseInt(id) },
            data: {
                reportedBy: {
                    connect: { id: userId },
                },
            },
        });
        res.status(200).json(query);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error reporting spam" });
    }
});
exports.reportSpam = reportSpam;
const searchQuery = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { search, tag } = req.query;
    const K = 3; // Number of top results to return
    try {
        if (!search) {
            res.status(400).json({ error: "Search term is required" });
            return;
        }
        // Step 1: Search Elasticsearch for relevant queries (user queries)
        const esQueryResult = yield elasticSearch_1.default.search({
            index: 'queries',
            query: {
                function_score: {
                    query: {
                        bool: {
                            must: [
                                {
                                    match: {
                                        content: {
                                            query: search,
                                            fuzziness: 'AUTO',
                                        },
                                    },
                                },
                            ],
                            filter: tag
                                ? [
                                    {
                                        term: {
                                            tags: tag,
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
        const queryHits = esQueryResult.hits.hits.map((hit) => ({
            queryID: parseInt(hit._id, 10),
            content: hit._source.content,
        }));
        // Step 2: Fetch answers for each query from Prisma
        const queriesWithAnswers = yield Promise.all(queryHits.map((hit) => __awaiter(void 0, void 0, void 0, function* () {
            const answers = yield prisma_1.default.answer.findMany({
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
            return Object.assign(Object.assign({}, hit), { answers: answers.map((answer) => ({
                    content: answer.content,
                    createdAt: answer.createdAt,
                    creatorName: answer.answerCreator.email,
                })) });
        })));
        // Step 4: Generate AI response based on query results
        let aiResponse;
        if (queriesWithAnswers.some((q) => q.answers.length > 0)) {
            aiResponse = yield (0, aiService_1.generateAIResponse)(search, queriesWithAnswers);
        }
        else {
            aiResponse = "Not enough data for a detailed response. Please refine your search.";
        }
        // Step 5: Return the response with both query results and codebase results
        res.status(200).json({
            results: {
                queries: queriesWithAnswers,
            },
            aiSuggestion: aiResponse,
        });
    }
    catch (error) {
        console.error("Error performing search:", error);
        res.status(500).json({ error: "Error performing search" });
    }
});
exports.searchQuery = searchQuery;
const searchGitHub = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { search } = req.query;
    const K = 3; // Number of top results to return
    try {
        if (!search) {
            res.status(400).json({ error: "Search term is required" });
            return;
        }
        // Search Elasticsearch for codebase files (project files)
        const esCodebaseResult = yield elasticSearch_1.default.search({
            index: 'codebase-index',
            query: {
                multi_match: {
                    query: search,
                    fields: ["content", "file_path", "project_name^2"],
                },
            },
            size: K, // Top K hits
        });
        // Extract codebase file results
        const codebaseHits = esCodebaseResult.hits.hits.map((hit) => {
            var _a, _b;
            return ({
                filename: hit._source.filename,
                file_path: hit._source.file_path,
                project_name: hit._source.project_name,
                github_url: hit._source.github_url,
                content_highlight: ((_b = (_a = hit.highlight) === null || _a === void 0 ? void 0 : _a.content) === null || _b === void 0 ? void 0 : _b[0]) || null, // If highlighted content exists
            });
        });
        res.status(200).json({
            results: codebaseHits,
        });
    }
    catch (error) {
        console.error("Error performing GitHub search:", error);
        res.status(500).json({ error: "Error performing GitHub search" });
    }
});
exports.searchGitHub = searchGitHub;
// GET /queries - Get all queries (feed)
const getFeed = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { tag } = req.query; // Optional tag filter
    console.log(tag);
    try {
        const queries = yield prisma_1.default.query.findMany({
            where: tag
                ? {
                    tags: {
                        some: { name: tag },
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
    }
    catch (error) {
        res.status(500).json({ error: "Error retrieving feed" });
    }
});
exports.getFeed = getFeed;
