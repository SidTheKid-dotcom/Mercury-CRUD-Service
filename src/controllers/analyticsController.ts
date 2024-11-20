import { Request, Response } from "express";
import prisma from "../prisma";

export const getAnalytics = async (req: Request, res: Response) => {
  const { tag, startDate, endDate } = req.query;

  try {
    // Build query filter dynamically
    const analyticsFilter: any = {};
    if (tag) analyticsFilter.tagName = tag;

    const dateFilter: any = {};
    if (startDate) dateFilter.date = { gte: new Date(startDate as string) };
    if (endDate) dateFilter.date = { ...dateFilter.date, lte: new Date(endDate as string) };

    const analytics = await prisma.queryAnalytics.findMany({
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching analytics" });
  }
};
