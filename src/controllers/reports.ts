import type { Context } from "hono";
import { PrismaClient } from "@prisma/client";

import parseIntParam from "utils/params";
import witCache from "utils/request-cache";
import parseQueryParams from "utils/query";

const prisma = new PrismaClient();

export const getReportById = await witCache(async (ctx: Context) => {
  try {
    const id = parseIntParam(ctx, "id");
    const query = await parseQueryParams(ctx);

    delete query.orderBy;
    delete query.where;
    delete query.orderBy;
    delete (query as any).skip;
    delete (query as any).take;

    const report = await prisma.news.findUnique({
      ...(query as any),
      where: { id },
    });

    if (!report) {
      ctx.status(404);
      return ctx.json({
        data: null,
        error: { details: [`Report with id (${id}) not found`] },
      });
    }

    return ctx.json({ data: report, error: null });
  } catch (error: any) {
    console.error(error);
    ctx.status(500);
    return ctx.json({
      data: null,
      error: { details: [error.message] },
    });
  }
});

export const getAllReports = await witCache(async (ctx: Context) => {
  try {
    const query = await parseQueryParams(ctx);

    const [count, reports] = await Promise.all([
      prisma.news.count({ where: query.where }),
      prisma.news.findMany(query),
    ]);

    return ctx.json({
      data: reports,
      error: null,
      pagination: {
        page: query.skip / query.take + 1,
        pageSize: query.take,
        pageCount: Math.ceil((count as number) / query.take),
        total: count,
      },
    });
  } catch (error: any) {
    console.error(error);
    ctx.status(500);
    return ctx.json({
      data: null,
      error: { details: [error.message] },
    });
  }
});
