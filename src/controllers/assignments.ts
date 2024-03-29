import type { Context } from "hono";
import { PrismaClient } from "@prisma/client";

import witCache from "utils/cache";
import parseIntParam from "utils/params";
import parseQueryParams from "utils/query";

const prisma = new PrismaClient();

export const getAssignmentById = await witCache(async (ctx: Context) => {
  try {
    const id = parseIntParam(ctx, "id");
    const query = await parseQueryParams(ctx);

    delete query.orderBy;
    delete query.where;
    delete query.orderBy;
    delete (query as any).skip;
    delete (query as any).take;

    const assignment = await prisma.assignment.findUnique({
      ...(query as any),
      where: { id },
    });

    if (!assignment) {
      ctx.status(404);
      return ctx.json({
        data: null,
        error: { details: [`Assignment with id (${id}) not found`] },
      });
    }

    return ctx.json({ data: assignment, error: null });
  } catch (error: any) {
    console.error(error);
    ctx.status(500);
    return ctx.json({
      data: null,
      error: { details: [error.message] },
    });
  }
});

export const getAllAssignments = await witCache(async (ctx: Context) => {
  try {
    const query = await parseQueryParams(ctx);

    const [count, assignments] = await Promise.all([
      prisma.assignment.count({ where: query.where }),
      prisma.assignment.findMany(query),
    ]);

    return ctx.json({
      data: assignments,
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

export const getAssignmentReward = await witCache(async (ctx: Context) => {
  try {
    const id = parseIntParam(ctx, "id");
    const query = await parseQueryParams(ctx);

    delete query.orderBy;
    delete query.where;
    delete query.orderBy;
    delete (query as any).skip;
    delete (query as any).take;

    const reward = await prisma.reward.findFirst({
      where: { assignment: { id } },
    });

    if (!reward) {
      ctx.status(404);
      return ctx.json({
        data: null,
        error: {
          details: [`Assignment with id (${id}) appears to have no reward`],
        },
      });
    }

    return ctx.json({ data: reward, error: null });
  } catch (error: any) {
    console.error(error);
    ctx.status(500);
    return ctx.json({
      data: null,
      error: { details: [error.message] },
    });
  }
});
