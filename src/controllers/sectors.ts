import type { Context } from "hono";

import { db } from "utils/database";
import parseIntParam from "utils/params";
import witCache from "utils/request-cache";
import parseQueryParams from "utils/query";

export const getSectorById = await witCache(async (ctx: Context) => {
  try {
    const id = parseIntParam(ctx, "id");
    const query = await parseQueryParams(ctx);

    delete query.orderBy;
    delete query.where;
    delete query.orderBy;
    delete (query as any).skip;
    delete (query as any).take;

    const sector = await db.sector.findUnique({
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
    ctx.get("sentry")?.captureException?.(error);
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
      db.sector.count({ where: query.where }),
      db.sector.findMany(query),
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
    ctx.get("sentry")?.captureException?.(error);
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
      db.planet.count({ where: query.where }),
      db.planet.findMany({
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
    ctx.get("sentry")?.captureException?.(error);
    ctx.status(500);
    return ctx.json({
      data: null,
      error: { details: [error.message] },
    });
  }
});
