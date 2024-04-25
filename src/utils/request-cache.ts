import type { Context } from "hono";

import RequestCache from "classes/request-cache";
import type { StatusCode } from "hono/utils/http-status";

type RouteController = (ctx: Context) => Promise<Response>;

export default async function withCache(cb: RouteController) {
  return async function (ctx: Context) {
    const response = await cb(ctx);

    const data = await response.json();
    RequestCache.set(
      {
        key: ctx.req.raw.url,
        status: response.status as StatusCode,
        data: data as any,
      },
      60,
    );

    ctx.status(response.status as any);
    return ctx.json(data);
  };
}
