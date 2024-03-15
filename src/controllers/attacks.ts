import type { Context } from "hono";
import { PrismaClient } from "@prisma/client";

import witCache from "utils/cache";
import parseIntParam from "utils/params";
import parseQueryParams from "utils/query";

const prisma = new PrismaClient();

export const getAttackById = await witCache(async (ctx: Context) => {
  try {
    const id = parseIntParam(ctx, "id");
    const query = await parseQueryParams(ctx);

    delete query.orderBy;
    delete query.where;
    delete query.orderBy;
    delete (query as any).skip;
    delete (query as any).take;

    const attack = await prisma.attack.findUnique({
      ...(query as any),
      where: { id },
    });

    if (!attack) {
      ctx.status(404);
      return ctx.json({
        data: null,
        error: { details: [`Attack with id (${id}) not found`] },
      });
    }

    return ctx.json({ data: attack, error: null });
  } catch (error: any) {
    console.error(error);
    ctx.status(500);
    return ctx.json({
      data: null,
      error: { details: [error.message] },
    });
  }
});

export const getAllAttacks = await witCache(async (ctx: Context) => {
  try {
    const query = await parseQueryParams(ctx);

    const [count, attacks] = await Promise.all([
      prisma.attack.count({ where: query.where }),
      prisma.attack.findMany(query),
    ]);

    return ctx.json({
      data: attacks,
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

export const getPlanetsByAttack = await witCache(async (ctx: Context) => {
  try {
    const id = parseIntParam(ctx, "id");
    const query = await parseQueryParams(ctx);

    delete query.orderBy;
    delete query.where;
    delete query.orderBy;
    delete (query as any).skip;
    delete (query as any).take;

    const [target, source] = await Promise.all([
      prisma.planet.findFirst({
        where: { attacking: { some: { id } } },
      }),
      prisma.planet.findFirst({
        where: { defending: { some: { id } } },
      }),
    ]);

    if (!source && !target) {
      ctx.status(404);
      return ctx.json({
        data: null,
        error: {
          details: [
            `Attack with id (${id}) appears not be associated with any planets`,
          ],
        },
      });
    }

    return ctx.json({ data: { source, target }, error: null });
  } catch (error: any) {
    console.error(error);
    ctx.status(500);
    return ctx.json({
      data: null,
      error: { details: [error.message] },
    });
  }
});
