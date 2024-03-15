import type { Context } from "hono";

export default function parseIntParam(ctx: Context, param: string) {
  const value = ctx.req.param(param);
  if (!value || isNaN(parseInt(value)) || parseInt(value) < 1) {
    throw new Error(`Invalid value for parameter (${param})`);
  }
  return parseInt(value);
}
