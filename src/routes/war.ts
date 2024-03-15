import type { Hono } from "hono";

import * as Wars from "controllers/war";

export default async function wars(app: Hono) {
  app.get("/war", Wars.getCurrentWar);
}
