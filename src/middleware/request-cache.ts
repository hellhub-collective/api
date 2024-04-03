import type { Context, Next } from "hono";

import RequestCache from "classes/request-cache";

export default async function cache(ctx: Context, next: Next) {
  const key = `__hono__${ctx.req.raw.url}`;
  const response = RequestCache.get<string>(key);

  if (response) {
    const { status, data } = JSON.parse(response);
    ctx.status(status);
    return ctx.json(data);
  }

  await next();
}
