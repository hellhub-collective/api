import type { Context } from "hono";
import { PrismaClient } from "@prisma/client";

import witCache from "utils/cache";
import parseIntParam from "utils/params";
import parseQueryParams from "utils/query";

const prisma = new PrismaClient();

export const getEventById = await witCache(async (ctx: Context) => {
  try {
    const id = parseIntParam(ctx, "id");
    const query = await parseQueryParams(ctx);

    delete query.orderBy;
    delete query.where;
    delete query.orderBy;
    delete (query as any).skip;
    delete (query as any).take;

    const event = await prisma.globalEvent.findUnique({
      ...(query as any),
      where: { id },
    });

    if (!event) {
      ctx.status(404);
      return ctx.json({
        data: null,
        error: { details: [`Event with id (${id}) not found`] },
      });
    }

    return ctx.json({ data: event, error: null });
  } catch (error: any) {
    console.error(error);
    ctx.status(500);
    return ctx.json({
      data: null,
      error: { details: [error.message] },
    });
  }
});

export const getAllEvents = await witCache(async (ctx: Context) => {
  try {
    const query = await parseQueryParams(ctx);

    const [count, events] = await Promise.all([
      prisma.globalEvent.count({ where: query.where }),
      prisma.globalEvent.findMany(query),
    ]);

    return ctx.json({
      data: events,
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
