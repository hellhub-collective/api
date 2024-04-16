import type { Context } from "hono";

import { db } from "utils/database";
import witCache from "utils/request-cache";
import captureException from "utils/sentry";

export const getCurrentWar = await witCache(async (ctx: Context) => {
  try {
    const war = await db.war.findFirst();

    return ctx.json({
      data: war,
      error: null,
    });
  } catch (error: any) {
    captureException(error);
    ctx.status(500);
    return ctx.json({
      data: null,
      error: { details: [error.message] },
    });
  }
});
