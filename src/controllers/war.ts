import type { Context } from "hono";

import { db } from "utils/database";
import witCache from "utils/request-cache";

export const getCurrentWar = await witCache(async (ctx: Context) => {
  try {
    const war = await db.war.findFirst();

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
