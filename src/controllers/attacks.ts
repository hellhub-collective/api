import type { Context } from "hono";

import { db } from "utils/database";
import parseIntParam from "utils/params";
import witCache from "utils/request-cache";
import parseQueryParams from "utils/query";

export const getAttackById = await witCache(async (ctx: Context) => {
  try {
    const id = parseIntParam(ctx, "id");
    const query = await parseQueryParams(ctx);

    delete query.orderBy;
    delete query.where;
    delete query.orderBy;
    delete (query as any).skip;
    delete (query as any).take;

    const attack = await db.attack.findUnique({
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
    ctx.get("sentry")?.captureException?.(error);
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
      db.attack.count({ where: query.where }),
      db.attack.findMany(query),
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
    ctx.get("sentry")?.captureException?.(error);
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
      db.planet.findFirst({
        where: { attacking: { some: { id } } },
      }),
      db.planet.findFirst({
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
    ctx.get("sentry")?.captureException?.(error);
    ctx.status(500);
    return ctx.json({
      data: null,
      error: { details: [error.message] },
    });
  }
});
