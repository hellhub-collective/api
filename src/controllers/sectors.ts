import type { Context } from "hono";
import { PrismaClient } from "@prisma/client";

import witCache from "utils/cache";
import parseIntParam from "utils/params";
import parseQueryParams from "utils/query";

const prisma = new PrismaClient();

export const getSectorById = await witCache(async (ctx: Context) => {
  try {
    const id = parseIntParam(ctx, "id");
    const query = await parseQueryParams(ctx);

    delete query.orderBy;
    delete query.where;
    delete query.orderBy;
    delete (query as any).skip;
    delete (query as any).take;

    const sector = await prisma.sector.findUnique({
      ...(query as any),
      where: { id },
    });

    if (!sector) {
      ctx.status(404);
      return ctx.json({
        data: null,
        error: { details: [`Sector with id (${id}) not found`] },
      });
    }

    return ctx.json({ data: sector, error: null });
  } catch (error: any) {
    console.error(error);
    ctx.status(500);
    return ctx.json({
      data: null,
      error: { details: [error.message] },
    });
  }
});

export const getAllSectors = await witCache(async (ctx: Context) => {
  try {
    const query = await parseQueryParams(ctx);

    const [count, sectors] = await Promise.all([
      prisma.sector.count({ where: query.where }),
      prisma.sector.findMany(query),
    ]);

    return ctx.json({
      data: sectors,
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

export const getPlanetsBySector = await witCache(async (ctx: Context) => {
  try {
    const query = await parseQueryParams(ctx);

    const [count, planets] = await Promise.all([
      prisma.planet.count({ where: query.where }),
      prisma.planet.findMany({
        ...query,
        where: {
          ...(query.where ?? {}),
          sectorId: parseIntParam(ctx, "id"),
        },
      }),
    ]);

    return ctx.json({
      data: planets,
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
