import Cache from "memory-cache";
import type { Context, TypedResponse } from "hono";

type RouteController = (ctx: Context) => Promise<Response>;

export default async function witCache(cb: RouteController) {
  return async function (ctx: Context) {
    const key = `__hono__${ctx.req.raw.url}`;
    const response = await cb(ctx);
    const data = await response.json();

    Cache.put(
      key,
      JSON.stringify({ status: response.status, data }),
      (1 * 50 * 1000) / 1.5,
    );

    ctx.status(response.status as any);
    return ctx.json(data);
  };
}
