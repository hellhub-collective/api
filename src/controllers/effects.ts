import type { Context } from "hono";

import db from "utils/database";
import parseIntParam from "utils/params";
import parseQueryParams from "utils/query";
import withCache from "utils/request-cache";

export const getEffectById = await withCache(async (ctx: Context) => {
  try {
    const id = parseIntParam(ctx, "id");
    const query = await parseQueryParams(ctx);

    delete query.orderBy;
    delete query.where;
    delete query.orderBy;
    delete (query as any).skip;
    delete (query as any).take;

    const effect = await db.effect.findUnique({
      ...(query as any),
      where: { id },
    });

    if (!effect) {
      ctx.status(404);
      return ctx.json({
        data: null,
        error: { details: [`Effect with id (${id}) not found`] },
      });
    }

    return ctx.json({ data: effect, error: null });
  } catch (error: any) {
    ctx.get("sentry")?.captureException?.(error);
    ctx.status(500);
    return ctx.json({
      data: null,
      error: { details: [error.message] },
    });
  }
});

export const getAllEffects = await withCache(async (ctx: Context) => {
  try {
    const query = await parseQueryParams(ctx);

    const [count, effects] = await Promise.all([
      db.effect.count({ where: query.where }),
      db.effect.findMany(query),
    ]);

    return ctx.json({
      data: effects,
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

export const getPlanetsByEffect = await withCache(async (ctx: Context) => {
  try {
    const id = parseIntParam(ctx, "id");
    const query = await parseQueryParams(ctx);

    delete query.where;
    const planets = await db.planet.findMany({
      ...query,
      where: { effects: { some: { id } } },
    });

    return ctx.json({ data: planets, error: null });
  } catch (error: any) {
    ctx.get("sentry")?.captureException?.(error);
    ctx.status(500);
    return ctx.json({
      data: null,
      error: { details: [error.message] },
    });
  }
});
