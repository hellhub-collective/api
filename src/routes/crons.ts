import type { Hono } from "hono";

import * as Cron from "controllers/crons";

export default async function crons(app: Hono) {
  app.get("/crons", Cron.getAllCrons);
  app.get("/crons/:name", Cron.getCronByName);
}
