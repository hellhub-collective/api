import type { Context } from "hono";
import { PrismaClient } from "@prisma/client";

import witCache from "utils/cache";
import parseIntParam from "utils/params";
import parseQueryParams from "utils/query";

const prisma = new PrismaClient();

export const getFactionById = await witCache(async (ctx: Context) => {
  try {
    const id = parseIntParam(ctx, "id");
    const query = await parseQueryParams(ctx);

    delete query.orderBy;
    delete query.where;
    delete query.orderBy;
    delete (query as any).skip;
    delete (query as any).take;

    const faction = await prisma.faction.findUnique({
      ...(query as any),
      where: { id },
    });

    if (!faction) {
      ctx.status(404);
      return ctx.json({
        data: null,
        error: { details: [`Faction with id (${id}) not found`] },
      });
    }

    return ctx.json({ data: faction, error: null });
  } catch (error: any) {
    console.error(error);
    ctx.status(500);
    return ctx.json({
      data: null,
      error: { details: [error.message] },
    });
  }
});

export const getAllFactions = await witCache(async (ctx: Context) => {
  try {
    const query = await parseQueryParams(ctx);

    const [count, factions] = await Promise.all([
      prisma.faction.count({ where: query.where }),
      prisma.faction.findMany(query),
    ]);

    return ctx.json({
      data: factions,
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

export const getFactionPlanets = await witCache(async (ctx: Context) => {
  try {
    const id = parseIntParam(ctx, "id");
    const query = await parseQueryParams(ctx);

    const [count, planets] = await Promise.all([
      prisma.planet.count({
        where: { ...(query.where ?? {}), ownerId: id },
      }),
      prisma.planet.findMany({
        ...query,
        where: { ...(query.where ?? {}), ownerId: id },
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

export const getFactionPushbacks = await witCache(async (ctx: Context) => {
  try {
    const id = parseIntParam(ctx, "id");
    const query = await parseQueryParams(ctx);

    const [count, planets] = await Promise.all([
      prisma.planet.count({
        where: {
          ...(query.where ?? {}),
          ownerId: { not: id },
          initialOwnerId: id,
        },
      }),
      prisma.planet.findMany({
        ...query,
        where: {
          ...(query.where ?? {}),
          ownerId: { not: id },
          initialOwnerId: id,
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

export const getFactionOrigin = await witCache(async (ctx: Context) => {
  try {
    const id = parseIntParam(ctx, "id");
    const query = await parseQueryParams(ctx);

    delete query.orderBy;
    delete query.where;
    delete query.orderBy;
    delete (query as any).skip;
    delete (query as any).take;

    const planet = await prisma.planet.findFirst({
      ...(query as any),
      where: { homeWorld: { some: { factionId: id } } },
    });

    if (!planet) {
      ctx.status(404);
      return ctx.json({
        data: null,
        error: {
          details: [`Faction with id (${id}) does not have a home planet.`],
        },
      });
    }

    return ctx.json({ data: planet, error: null });
  } catch (error: any) {
    console.error(error);
    ctx.status(500);
    return ctx.json({
      data: null,
      error: { details: [error.message] },
    });
  }
});

export const getFactionOrders = await witCache(async (ctx: Context) => {
  try {
    const id = parseIntParam(ctx, "id");
    const query = await parseQueryParams(ctx);

    const [count, orders] = await Promise.all([
      prisma.order.count({
        where: { ...(query.where ?? {}), factionId: id },
      }),
      prisma.order.findMany({
        ...query,
        where: { ...(query.where ?? {}), factionId: id },
      }),
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
