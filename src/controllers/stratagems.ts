import type { Context } from "hono";

import { db } from "utils/database";
import parseIntParam from "utils/params";
import witCache from "utils/request-cache";
import parseQueryParams from "utils/query";
import captureException from "utils/sentry";

export const getStratagemById = await witCache(async (ctx: Context) => {
  try {
    const id = parseIntParam(ctx, "id");
    const query = await parseQueryParams(ctx);

    delete query.orderBy;
    delete query.where;
    delete query.orderBy;
    delete (query as any).skip;
    delete (query as any).take;

    const stratagem = await db.stratagem.findUnique({
      ...(query as any),
      where: { id },
    });

    if (!stratagem) {
      ctx.status(404);
      return ctx.json({
        data: null,
        error: { details: [`Stratagem with id (${id}) not found`] },
      });
    }

    // slightly transform the data
    const imageBaseUrl = process.env.STRATAGEM_IMAGE_URL || "";
    stratagem.imageUrl = `${imageBaseUrl}${stratagem.imageUrl}`;
    (stratagem as any).keys = stratagem.keys.split(",");

    return ctx.json({ data: stratagem, error: null });
  } catch (error: any) {
    captureException(error);
    ctx.status(500);
    return ctx.json({
      data: null,
      error: { details: [error.message] },
    });
  }
});

export const getAllStratagems = await witCache(async (ctx: Context) => {
  try {
    const query = await parseQueryParams(ctx);

    const [count, stratagems] = await Promise.all([
      db.stratagem.count({ where: query.where }),
      db.stratagem.findMany(query),
    ]);

    return ctx.json({
      data: stratagems.map(stratagem => {
        // slightly transform the data
        const imageBaseUrl = process.env.STRATAGEM_IMAGE_URL || "";
        stratagem.imageUrl = `${imageBaseUrl}${stratagem.imageUrl}`;
        (stratagem as any).keys = stratagem.keys.split(",");
        return stratagem;
      }),
      error: null,
      pagination: {
        page: query.skip / query.take + 1,
        pageSize: query.take,
        pageCount: Math.ceil((count as number) / query.take),
        total: count,
      },
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
