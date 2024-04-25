import type { Context, Next } from "hono";

import RateLimiter from "classes/rate-limit";

const RATE_LIMIT = parseInt(process.env.RATE_LIMIT || "60");

export default async function rateLimit(ctx: Context, next: Next) {
  const ip =
    ctx.req.header("X-Forwarded-For") || ctx.req.header("X-Real-IP") || "anon";

  const rl = RateLimiter.get(ip);
  const now = Date.now();
  const reset = now + 1000 * 60;

  ctx.res.headers.set("X-Rate-Limit", `${RATE_LIMIT}`);
  ctx.res.headers.set("X-Rate-Count", `${rl?.count ?? 1}`);
  ctx.res.headers.set("X-Rate-Reset", `${rl?.reset ?? reset}`);
  ctx.res.headers.set("X-Rate-Remaining", `${rl?.remaining ?? RATE_LIMIT}`);

  if (!rl) {
    RateLimiter.set(
      {
        ip,
        count: 1,
        reset: reset,
        threshold: RATE_LIMIT,
        remaining: RATE_LIMIT - 1,
      },
      60,
    );

    return await next();
  }

  if (rl.count < RATE_LIMIT) {
    RateLimiter.set(
      {
        ...rl,
        count: rl.count + 1,
        remaining: rl.threshold - (rl.count + 1),
      },
      60,
    );

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
