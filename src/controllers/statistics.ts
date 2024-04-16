import type { Context } from "hono";
import type { Stats } from "@prisma/client";

import { db } from "utils/database";
import parseIntParam from "utils/params";
import witCache from "utils/request-cache";
import parseQueryParams from "utils/query";

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
      statistic = await db.stats.findFirst({
        ...(query as any),
        where: { planet: { is: null } },
      });
    } else {
      statistic = await db.stats.findUnique({
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

    return ctx.json({ data: statistic, error: null });
  } catch (error: any) {
    ctx.get("sentry")?.captureException?.(error);
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
      db.stats.count({ where: query.where }),
      db.stats.findMany(query),
    ]);

    return ctx.json({
      data: statistics,
      error: null,
      pagination: {
        page: query.skip / query.take + 1,
        pageSize: query.take,
        pageCount: Math.ceil((count as number) / query.take),
        total: count,
      },
    });
  } catch (error: any) {
    ctx.get("sentry")?.captureException?.(error);
    ctx.status(500);
    return ctx.json({
      data: null,
      error: { details: [error.message] },
    });
  }
});
