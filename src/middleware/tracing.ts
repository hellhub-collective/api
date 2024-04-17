import type { Context, Next } from "hono";

export default async function tracing(ctx: Context, next: Next) {
  const sentry = ctx.get("sentry");
  if (!sentry) return next();

  const ip = ctx.req.header("X-Forwarded-For") || ctx.req.header("X-Real-IP");
  if (ip) sentry.setUser({ ip_address: ip });

  const transaction = sentry.startTransaction({
    op: "http.server",
    name: `${ctx.req.method} ${ctx.req.routePath}`,
  });

  sentry.configureScope(scope => {
    scope.setSpan(transaction);
  });

  try {
    await next();
  } catch (error: any) {
    sentry.captureException(error);
  } finally {
    transaction.setHttpStatus(ctx.res.status);

    transaction.setData("body", ctx.res.body);
    transaction.setData("headers", ctx.req.header());
    transaction.setData("query", ctx.req.query());

    transaction.setName(`${ctx.req.method} ${ctx.req.routePath}`);
    transaction.description = ctx.req.path;

    transaction.setTag("http.url", ctx.req.url);
    transaction.setTag("http.path", ctx.req.path);
    transaction.setTag("http.method", ctx.req.method);
    if (!!ip) transaction.setTag("http.remote_addr", ip);

    transaction.finish();
    sentry.setUser(null);
  }

  return;
}
