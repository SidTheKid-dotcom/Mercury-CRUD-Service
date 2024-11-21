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
exports.getAnalytics = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getAnalytics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { tag, startDate, endDate } = req.query;
    try {
        // Build query filter dynamically
        const analyticsFilter = {};
        if (tag)
            analyticsFilter.tagName = tag;
        const dateFilter = {};
        if (startDate)
            dateFilter.date = { gte: new Date(startDate) };
        if (endDate)
            dateFilter.date = Object.assign(Object.assign({}, dateFilter.date), { lte: new Date(endDate) });
        const analytics = yield prisma_1.default.queryAnalytics.findMany({
            where: analyticsFilter,
            include: {
                dailyData: {
                    where: dateFilter,
                },
            },
        });
        if (!analytics || analytics.length === 0) {
            res.status(404).json({ error: "Analytics data not found" });
            return;
        }
        // Format response to include overall stats and daily breakdown
        const formattedResponse = analytics.map((item) => ({
            tagName: item.tagName,
            queryCount: item.queryCount,
            answerCount: item.answerCount,
            dailyData: item.dailyData.map((data) => ({
                date: data.date.toISOString().split("T")[0],
                queries: data.queries,
                answers: data.answers,
            })),
        }));
        res.status(200).json(formattedResponse);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error fetching analytics" });
    }
});
exports.getAnalytics = getAnalytics;
