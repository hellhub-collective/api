import type { Context } from "hono";
import { PrismaClient } from "@prisma/client";

import witCache from "utils/request-cache";

const prisma = new PrismaClient();

export const getCurrentWar = await witCache(async (ctx: Context) => {
  try {
    const war = await prisma.war.findFirst();

    return ctx.json({
      data: war,
      error: null,
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
