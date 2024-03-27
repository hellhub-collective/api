import "jobs/refresh";

import { Hono } from "hono";
import { cors } from "hono/cors";

import cache from "middleware/cache";
import rateLimit from "middleware/rate-limit";

import wars from "routes/war";
import orders from "routes/orders";
import events from "routes/events";
import planets from "routes/planets";
import sectors from "routes/sectors";
import attacks from "routes/attacks";
import factions from "routes/factions";
import stratagems from "routes/stratagems";
import statistics from "routes/statistics";
import assignments from "routes/assignments";

// initiate hono api
const app = new Hono().basePath("/api");

// middleware for the api
app.use("/*", cors());
app.use(rateLimit);
app.use(cache);

// routes for the api
const routes = [
  wars,
  events,
  orders,
  planets,
  sectors,
  attacks,
  factions,
  stratagems,
  statistics,
  assignments,
];

for (const route of routes) await route(app);
export default app;
