import type { Context, Next } from "hono";

import RequestCache from "classes/request-cache";

export default async function cache(ctx: Context, next: Next) {
  const response = RequestCache.get(ctx.req.raw.url);
  if (response) {
    ctx.status(response.status);
    return ctx.json({ ...response.data });
  }
  await next();
}
