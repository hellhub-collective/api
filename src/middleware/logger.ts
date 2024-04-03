import chalk from "chalk";
import type { Context, Next } from "hono";

const status = (code: number) => {
  let result;

  if (!result && code >= 500) {
    result = chalk.red(code);
  }

  if (!result && code >= 400) {
    result = chalk.yellow(code);
  }

  if (!result && code >= 300) {
    result = chalk.green(code);
  }

  if (!result && code >= 200) {
    result = chalk.green(code);
  }

  if (!result) {
    result = chalk.gray(code);
  }

  return chalk.bold(result);
};

const method = (verb: string) => {
  let result;
  switch (verb) {
    case "GET":
      result = chalk.green(verb);
      break;
    case "POST":
      result = chalk.yellow(verb);
      break;
    case "PUT":
      result = chalk.blue(verb);
      break;
    case "PATCH":
      result = chalk.blue(verb);
      break;
    case "DELETE":
      result = chalk.red(verb);
      break;
    default:
      result = chalk.gray(verb);
      break;
  }

  return chalk.bold(result);
};

export default async function logger(ctx: Context, next: Next) {
  const start = Date.now();
  try {
    await next();
  } finally {
    const durationMs = Date.now() - start;
    const ip = ctx.req.header("X-Forwarded-For") || ctx.req.header("X-Real-IP");
    console.log(
      `${ip ? `${ip} | ` : ""}${method(
        ctx.req.method,
      )} ${ctx.req.path} ${status(ctx.res.status)} ${chalk.grey(
        `(${durationMs}ms)`,
      )}`,
    );
  }
}
