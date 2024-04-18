import type { Cron } from "croner";
import type { Context } from "hono";

import * as crons from "jobs";

function cronJSON(defaultName: string, cron: Cron) {
  const previous = cron.currentRun()?.getTime() ?? null;
  const current = cron.previousRun()?.getTime() ?? null;
  const next = cron.msToNext();
  return {
    name: cron.name ?? defaultName,
    pattern: cron.getPattern(),
    status: cron.isRunning() ? "scheduled" : "stopped",
    running: cron.isBusy(),
    runs: {
      current,
      previous,
      next: next ? Date.now() + next : null,
    },
  };
}

export const getAllCrons = async (ctx: Context) => {
  try {
    const jobs = [];

    for (const key in crons) {
      const job = cronJSON(key, crons[key as keyof typeof crons] as Cron);
      jobs.push(job);
    }

    return ctx.json({
      data: jobs,
      error: null,
      pagination: {
        page: 1,
        pageSize: jobs.length,
        pageCount: 1,
        total: jobs.length,
      },
    });
  } catch (error: any) {
    ctx.get("sentry")?.captureException?.(error);
    ctx.status(500);
    return ctx.json({
      data: null,
      error: { details: [error.message] },
    });
  }
};

export const getCronByName = async (ctx: Context) => {
  try {
    const name = ctx.req.param("name");

    for (const key in crons) {
      if (key !== name) continue;
      const job = cronJSON(name, crons[key as keyof typeof crons] as Cron);
      ctx.status(200);
      return ctx.json({ data: job, error: null });
    }

    ctx.status(404);
    return ctx.json({
      data: null,
      error: { details: [`Cron job with name (${name}) not found`] },
    });
  } catch (error: any) {
    ctx.get("sentry")?.captureException?.(error);
    ctx.status(500);
    return ctx.json({
      data: null,
      error: { details: [error.message] },
    });
  }
};
