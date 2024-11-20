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
exports.getFeed = exports.searchQuery = exports.reportSpam = exports.voteQuery = exports.answerQuery = exports.postQuery = void 0;
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
        const analytics = yield prisma_1.default.queryAnalytics.findFirst();
        if (analytics) {
            const updatedTagCounts = Object.assign({}, analytics.tagCounts);
            query.tags.forEach(tag => {
                updatedTagCounts[tag.name] = (updatedTagCounts[tag.name] || 0) + 1;
            });
            yield prisma_1.default.queryAnalytics.update({
                where: { id: analytics.id },
                data: {
                    totalQuestions: { increment: 1 },
                    tagCounts: updatedTagCounts,
                },
            });
        }
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
        const analytics = yield prisma_1.default.queryAnalytics.findFirst();
        if (analytics) {
            yield prisma_1.default.queryAnalytics.update({
                where: { id: analytics.id },
                data: {
                    totalAnswers: { increment: 1 },
                },
            });
        }
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
        // Step 3: Search Elasticsearch for codebase files (project files)
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
                codebase: codebaseHits,
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
