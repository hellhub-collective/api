import type { Hono } from "hono";

import * as Statistics from "controllers/statistics";

export default async function statistics(app: Hono) {
  app.get("/statistics", Statistics.getAllStatistics);
  app.get("/statistics/:id", Statistics.getStatisticById);
}
