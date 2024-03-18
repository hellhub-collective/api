import Cache from "memory-cache";
import type { Context, Next } from "hono";

const RATE_LIMIT = parseInt(process.env.RATE_LIMIT || "60");

interface RateLimit {
  count: number;
  reset: number;
  limit: number;
  remaining: number;
}

export default async function rateLimit(ctx: Context, next: Next) {
  const ip = ctx.req.header("X-Forwarded-For") || ctx.req.header("X-Real-IP");
  const key = `rate-limit:${ip ?? "unknown"}`;
  const rl: RateLimit = Cache.get(key);

  const now = Date.now();
  const reset = now + 1000 * 60;

  ctx.res.headers.set("X-Rate-Limit", `${RATE_LIMIT}`);
  ctx.res.headers.set("X-Rate-Count", `${rl?.count ?? 1}`);
  ctx.res.headers.set("X-Rate-Reset", `${rl?.reset ?? reset}`);
  ctx.res.headers.set("X-Rate-Remaining", `${rl?.remaining ?? RATE_LIMIT}`);

  if (!rl) {
    const payload: RateLimit = {
      count: 1,
      reset: reset,
      limit: RATE_LIMIT,
      remaining: RATE_LIMIT - 1,
    };

    Cache.put(key, payload, 1000 * 60);
    return await next();
  }

  if (rl.count < RATE_LIMIT) {
    const payload: RateLimit = {
      ...rl,
      count: rl.count + 1,
      remaining: rl.limit - (rl.count + 1),
    };

    Cache.put(key, payload, 1000 * 60);
    return await next();
  }

  ctx.status(429);
  return ctx.json({
    data: null,
    error: {
      details: ["Rate limit exceeded"],
    },
  });
}
