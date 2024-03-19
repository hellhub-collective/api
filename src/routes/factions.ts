import type { Hono } from "hono";

import * as Factions from "controllers/factions";

export default async function factions(app: Hono) {
  app.get("/factions", Factions.getAllFactions);
  app.get("/factions/:id", Factions.getFactionById);
  app.get("/factions/:id/orders", Factions.getFactionOrders);
  app.get("/factions/:id/origins", Factions.getFactionOrigin);
  app.get("/factions/:id/planets", Factions.getFactionPlanets);
  app.get("/factions/:id/pushbacks", Factions.getFactionPushbacks);
}
