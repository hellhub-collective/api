import qs from "qs";
import type { Context } from "hono";

interface PrismaQuery {
  skip: number;
  take: number;
  where: any;
  orderBy: any;
  select: any;
  include?: any;
}

export async function parseIntProperties(obj: any) {
  for (const key in obj) {
    if (typeof obj[key] === "string" && !isNaN(parseInt(obj[key]))) {
      obj[key] = parseInt(obj[key]);
    } else if (typeof obj[key] === "object") {
      obj[key] = await parseIntProperties(obj[key]);
    } else if (Array.isArray(obj[key])) {
      obj[key] = await Promise.all(obj[key].map(parseIntProperties));
    }
  }
  return obj;
}

export async function parseWhereArgs(ctx: Context) {
  const [_, _where] = ctx.req.raw.url.split("?");
  if (!_where) return undefined;
  const { filters } = qs.parse(_where);
  if (!filters) return undefined;
  return await parseIntProperties(filters);
}

export async function parseOrderByArgs(ctx: Context) {
  const [_, _orderBy] = ctx.req.raw.url.split("?");
  if (!_orderBy) return undefined;
  const { sort } = qs.parse(_orderBy);
  if (!sort) return undefined;

  if (Array.isArray(sort)) {
    const obj = {};
    for (const key of sort) {
      const [field, mode] = (key as any).split(":");
      (obj as any)[field] = mode;
    }
    return obj;
  }

  return sort;
}

export async function parseSelectArgs(ctx: Context) {
  const [_, _select] = ctx.req.raw.url.split("?");
  if (!_select) return undefined;
  const { select } = qs.parse(_select);
  if (!select) return undefined;
  for (const key in select as any)
    (select as any)[key] = Boolean((select as any)[key]);
  return select;
}

export async function parseIncludeArgs(ctx: Context) {
  const [_, _include] = ctx.req.raw.url.split("?");
  if (!_include) return undefined;
  const { include } = qs.parse(_include);
  if (!include) return undefined;

  if (Array.isArray(include)) {
    const obj = {};
    for (const key of include) (obj as any)[key.toString()] = true;
    return obj;
  }

  for (const key in include as any)
    (include as any)[key] = Boolean((include as any)[key]);
  return include;
}

export default async function parseQueryParams(
  ctx: Context,
): Promise<PrismaQuery> {
  const _limit = ctx.req.query("limit") ?? "15";
  const _start = ctx.req.query("start") ?? "0";

  const skip = parseInt(_start) < 0 ? 0 : parseInt(_start);
  const take = parseInt(_limit) > 100 ? 100 : parseInt(_limit);

  const where = await parseWhereArgs(ctx);
  const orderBy = await parseOrderByArgs(ctx);
  const select = await parseSelectArgs(ctx);
  const include = await parseIncludeArgs(ctx);

  return { skip, take, orderBy, where, select, include };
}
