import "jobs/refresh";

import { Hono } from "hono";

import wars from "routes/war";
import events from "routes/events";
import cache from "middleware/cache";
import planets from "routes/planets";
import sectors from "routes/sectors";
import attacks from "routes/attacks";
import factions from "routes/factions";

// initiate hono api
const app = new Hono().basePath("/api");
app.use(cache);

// routes for the api
const routes = [planets, sectors, wars, factions, attacks, events];
for (const route of routes) await route(app);

export default app;
