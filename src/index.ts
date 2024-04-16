import "jobs/refresh";
import "polyfills/BigInt";

import { Hono } from "hono";
import { cors } from "hono/cors";

import logger from "middleware/logger";
import cache from "middleware/request-cache";
import rateLimit from "middleware/rate-limit";

import wars from "routes/war";
import biomes from "routes/biomes";
import orders from "routes/orders";
import events from "routes/events";
import effects from "routes/effects";
import planets from "routes/planets";
import sectors from "routes/sectors";
import reports from "routes/reports";
import attacks from "routes/attacks";
import factions from "routes/factions";
import stratagems from "routes/stratagems";
import statistics from "routes/statistics";
import assignments from "routes/assignments";

// initiate hono api
const app = new Hono().basePath("/api");

// middleware for the api
app.use(logger);
app.use("/*", cors());
app.use(rateLimit);
app.use(cache);

// routes for the api
const routes = [
  wars,
  biomes,
  events,
  orders,
  reports,
  planets,
  effects,
  sectors,
  attacks,
  factions,
  stratagems,
  statistics,
  assignments,
];

for (const route of routes) await route(app);
export default app;
