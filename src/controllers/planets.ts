import type { Context } from "hono";
import { PrismaClient } from "@prisma/client";

import witCache from "utils/cache";
import parseIntParam from "utils/params";
import parseQueryParams from "utils/query";

const prisma = new PrismaClient();

export const getPlanetById = await witCache(async (ctx: Context) => {
  try {
    const id = parseIntParam(ctx, "id");
    const query = await parseQueryParams(ctx);

    delete query.orderBy;
    delete query.where;
    delete query.orderBy;
    delete (query as any).skip;
    delete (query as any).take;

    const planet = await prisma.planet.findUnique({
      ...(query as any),
      where: { id },
    });

    if (!planet) {
      ctx.status(404);
      return ctx.json({
        data: null,
        error: { details: [`Planet with id (${id}) not found`] },
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

export const getAllPlanets = await witCache(async (ctx: Context) => {
  try {
    const query = await parseQueryParams(ctx);

    const [count, planets] = await Promise.all([
      prisma.planet.count({ where: query.where }),
      prisma.planet.findMany(query),
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

export const getPlanetAttacks = await witCache(async (ctx: Context) => {
  try {
    const id = parseIntParam(ctx, "id");
    const query = await parseQueryParams(ctx);

    const [count, attacks] = await Promise.all([
      prisma.attack.count({
        where: {
          OR: [{ source: { id } }, { target: { id } }],
        },
      }),
      prisma.attack.findMany({
        ...(query ?? {}),
        where: {
          ...(query.where as any),
          OR: [
            ...(query?.where?.OR ?? []),
            { source: { id } },
            { target: { id } },
          ],
        },
      }),
    ]);

    const attacking = attacks.filter(a => a.sourceId === id);
    const defending = attacks.filter(a => a.targetId === id);

    return ctx.json({
      data: { attacking, defending },
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

export const getPlanetOwners = await witCache(async (ctx: Context) => {
  try {
    const id = parseIntParam(ctx, "id");
    const query = await parseQueryParams(ctx);

    delete query.orderBy;
    delete query.where;
    delete query.orderBy;
    delete (query as any).skip;
    delete (query as any).take;

    const [owner, initialOwner] = await Promise.all([
      prisma.faction.findFirst({
        where: { planets: { some: { id } } },
      }),
      prisma.faction.findFirst({
        where: { initialPlanets: { some: { id } } },
      }),
    ]);

    if (!owner && !initialOwner) {
      ctx.status(404);
      return ctx.json({
        data: null,
        error: {
          details: [`Planet with id (${id}) appears to have no owners`],
        },
      });
    }

    return ctx.json({ data: { owner, initialOwner }, error: null });
  } catch (error: any) {
    console.error(error);
    ctx.status(500);
    return ctx.json({
      data: null,
      error: { details: [error.message] },
    });
  }
});

export const getPlanetCampaigns = await witCache(async (ctx: Context) => {
  try {
    const id = parseIntParam(ctx, "id");
    const query = await parseQueryParams(ctx);

    const [count, campaigns] = await Promise.all([
      prisma.campaign.count({
        where: { planetId: id },
      }),
      prisma.campaign.findMany({
        ...(query ?? {}),
        where: { ...(query.where as any), planetId: id },
      }),
    ]);

    return ctx.json({
      data: campaigns,
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

export const getPlanetOrders = await witCache(async (ctx: Context) => {
  try {
    const id = parseIntParam(ctx, "id");
    const query = await parseQueryParams(ctx);

    const [count, orders] = await Promise.all([
      prisma.order.count({
        where: { planetId: id },
      }),
      prisma.order.findMany({
        ...(query ?? {}),
        where: { ...(query.where as any), planetId: id },
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

export const getPlanetStatistics = await witCache(async (ctx: Context) => {
  try {
    const id = parseIntParam(ctx, "id");
    const query = await parseQueryParams(ctx);

    delete query.orderBy;
    delete query.where;
    delete query.orderBy;
    delete (query as any).skip;
    delete (query as any).take;

    const stats = await prisma.stats.findFirst({
      ...(query as any),
      where: { planet: { id } },
    });

    if (!stats) {
      ctx.status(404);
      return ctx.json({
        data: null,
        error: { details: [`Statistics for planet with id (${id}) not found`] },
      });
    }

    const edited = JSON.stringify(stats, (_, value) => {
      if (typeof value === "bigint") return parseInt(value.toString(), 10);
      return value;
    });

    return ctx.json({ data: JSON.parse(edited), error: null });
  } catch (error: any) {
    console.error(error);
    ctx.status(500);
    return ctx.json({
      data: null,
      error: { details: [error.message] },
    });
  }
});
