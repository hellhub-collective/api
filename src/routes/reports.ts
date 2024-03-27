import type { Hono } from "hono";

import * as Reports from "controllers/reports";

export default async function reports(app: Hono) {
  app.get("/reports", Reports.getAllReports);
  app.get("/reports/:id", Reports.getReportById);
}
