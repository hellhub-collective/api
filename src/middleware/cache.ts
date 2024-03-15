import Cache from "memory-cache";
import type { Context, Next } from "hono";

export default async function cache(ctx: Context, next: Next) {
  const key = `__hono__${ctx.req.raw.url}`;
  const response = Cache.get(key);

  if (response) {
    const { status, data } = JSON.parse(response);
    ctx.status(status);
    return ctx.json(data);
  }

  await next();
}
