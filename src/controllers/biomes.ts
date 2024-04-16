import type { Context } from "hono";

import { db } from "utils/database";
import parseIntParam from "utils/params";
import witCache from "utils/request-cache";
import parseQueryParams from "utils/query";

export const getBiomeById = await witCache(async (ctx: Context) => {
  try {
    const id = parseIntParam(ctx, "id");
    const query = await parseQueryParams(ctx);

    delete query.orderBy;
    delete query.where;
    delete query.orderBy;
    delete (query as any).skip;
    delete (query as any).take;

    const biome = await db.biome.findUnique({
      ...(query as any),
      where: { id },
    });

    if (!biome) {
      ctx.status(404);
      return ctx.json({
        data: null,
        error: { details: [`Biome with id (${id}) not found`] },
      });
    }

    return ctx.json({ data: biome, error: null });
  } catch (error: any) {
    console.error(error);
    ctx.status(500);
    return ctx.json({
      data: null,
      error: { details: [error.message] },
    });
  }
});

export const getAllBiomes = await witCache(async (ctx: Context) => {
  try {
    const query = await parseQueryParams(ctx);

    const [count, biomes] = await Promise.all([
      db.biome.count({ where: query.where }),
      db.biome.findMany(query),
    ]);

    return ctx.json({
      data: biomes,
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

export const getPlanetsByBiome = await witCache(async (ctx: Context) => {
  try {
    const id = parseIntParam(ctx, "id");
    const query = await parseQueryParams(ctx);

    delete query.where;
    const planets = await db.planet.findMany({
      ...query,
      where: { biome: { id } },
    });

    return ctx.json({ data: planets, error: null });
  } catch (error: any) {
    console.error(error);
    ctx.status(500);
    return ctx.json({
      data: null,
      error: { details: [error.message] },
    });
  }
});
