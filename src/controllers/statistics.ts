import type { Context } from "hono";
import { PrismaClient, type Stats } from "@prisma/client";

import witCache from "utils/cache";
import parseIntParam from "utils/params";
import parseQueryParams from "utils/query";

const prisma = new PrismaClient();

export const getStatisticById = await witCache(async (ctx: Context) => {
  try {
    let id: number | "galaxy" | null = null;

    if (ctx.req.param("id") !== "galaxy") {
      id = parseIntParam(ctx, "id");
    } else {
      id = "galaxy";
    }

    const query = await parseQueryParams(ctx);

    delete query.orderBy;
    delete query.where;
    delete query.orderBy;
    delete (query as any).skip;
    delete (query as any).take;

    let statistic: Stats | null = null;

    if (id === "galaxy") {
      statistic = await prisma.stats.findFirst({
        ...(query as any),
        where: { planet: { is: null } },
      });
    } else {
      statistic = await prisma.stats.findUnique({
        ...(query as any),
        where: { id },
      });
    }

    if (!statistic) {
      ctx.status(404);
      return ctx.json({
        data: null,
        error: {
          details: [
            id === "galaxy"
              ? "Galaxy statistic not found"
              : `Statistic with id (${id}) not found`,
          ],
        },
      });
    }

    const edited = JSON.stringify(statistic, (_, value) => {
      if (typeof value === "bigint") return parseInt(value.toString(), 10);
      return value;
    });

    return ctx.json({ data: JSON.parse(edited), error: null });
  } catch (error: any) {
    console.error(error);
    ctx.status(500);
    return ctx.json({
      data: null,
      error: { details: [error.message] },
    });
  }
});

export const getAllStatistics = await witCache(async (ctx: Context) => {
  try {
    const query = await parseQueryParams(ctx);

    const [count, statistics] = await Promise.all([
      prisma.stats.count({ where: query.where }),
      prisma.stats.findMany(query),
    ]);

    const edited = JSON.stringify(statistics, (_, value) => {
      if (typeof value === "bigint") return parseInt(value.toString(), 10);
      return value;
    });

    return ctx.json({
      data: JSON.parse(edited),
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
