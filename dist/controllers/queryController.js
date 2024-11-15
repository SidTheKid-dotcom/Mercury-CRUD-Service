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
exports.getFeed = exports.answerQuery = exports.postQuery = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const postQuery = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { content, tags } = req.body; // Accept tags as an array of strings
    try {
        const query = yield prisma_1.default.query.create({
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
    }
    catch (error) {
        res.status(500).json({ error: "Error posting query" });
    }
});
exports.postQuery = postQuery;
// POST /queries/:id/answer - Answer a specific query
const answerQuery = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { content } = req.body;
    try {
        const answer = yield prisma_1.default.answer.create({
            data: {
                content,
                queryId: parseInt(id),
            },
        });
        res.status(201).json(answer);
    }
    catch (error) {
        res.status(500).json({ error: "Error answering query" });
    }
});
exports.answerQuery = answerQuery;
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
