import type { Context, Next } from "hono";
import type { StatusCode } from "hono/utils/http-status";

import RequestCache from "classes/request-cache";

export default async function cache(ctx: Context, next: Next) {
  const key = `__hono__${ctx.req.raw.url}`;
  const response = RequestCache.get<{ status: StatusCode; data: any }>(key);

  if (response) {
    ctx.status(response.status);
    return ctx.json(response.data);
  }

  await next();
}
