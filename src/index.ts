import "jobs";
import "polyfills/BigInt";

import { Hono } from "hono";
import { cors } from "hono/cors";
import { sentry } from "@hono/sentry";

import logger from "middleware/logger";
import tracing from "middleware/tracing";
import cache from "middleware/request-cache";
import rateLimit from "middleware/rate-limit";

import { initSentry, sentryOptions } from "utils/sentry";

import wars from "routes/war";
import crons from "routes/crons";
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
if (process.env.SENTRY_DSN && process.env.NODE_ENV === "production") {
  initSentry();
  app.use("*", sentry({ ...(sentryOptions as any) }));
}

app.use("/*", cors());

app.use(logger);
app.use(tracing);
app.use(rateLimit);
app.use(cache);

// routes for the api
const routes = [
  wars,
  crons,
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
