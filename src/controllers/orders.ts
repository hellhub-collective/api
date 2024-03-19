import type { Context } from "hono";
import { PrismaClient } from "@prisma/client";

import witCache from "utils/cache";
import parseIntParam from "utils/params";
import parseQueryParams from "utils/query";

const prisma = new PrismaClient();

export const getOrderById = await witCache(async (ctx: Context) => {
  try {
    const id = parseIntParam(ctx, "id");
    const query = await parseQueryParams(ctx);

    delete query.orderBy;
    delete query.where;
    delete query.orderBy;
    delete (query as any).skip;
    delete (query as any).take;

    const order = await prisma.order.findUnique({
      ...(query as any),
      where: { id },
    });

    if (!order) {
      ctx.status(404);
      return ctx.json({
        data: null,
        error: { details: [`Order with id (${id}) not found`] },
      });
    }

    return ctx.json({ data: order, error: null });
  } catch (error: any) {
    console.error(error);
    ctx.status(500);
    return ctx.json({
      data: null,
      error: { details: [error.message] },
    });
  }
});

export const getAllOrders = await witCache(async (ctx: Context) => {
  try {
    const query = await parseQueryParams(ctx);

    const [count, orders] = await Promise.all([
      prisma.order.count({ where: query.where }),
      prisma.order.findMany(query),
    ]);

    return ctx.json({
      data: orders,
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
