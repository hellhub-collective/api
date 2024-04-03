import type { Context } from "hono";

import RequestCache from "classes/request-cache";

type RouteController = (ctx: Context) => Promise<Response>;

export default async function witCache(cb: RouteController) {
  return async function (ctx: Context) {
    const key = `__hono__${ctx.req.raw.url}`;
    const response = await cb(ctx);
    const data = await response.json();

    RequestCache.set(
      key,
      JSON.stringify({ status: response.status, data }),
      50,
    );

    ctx.status(response.status as any);
    return ctx.json(data);
  };
}
