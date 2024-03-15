import type { Hono } from "hono";

import * as Planets from "controllers/planets";

export default async function planets(app: Hono) {
  app.get("/planets", Planets.getAllPlanets);
  app.get("/planets/:id", Planets.getPlanetById);
  app.get("/planets/:id/owners", Planets.getPlanetOwners);
  app.get("/planets/:id/attacks", Planets.getPlanetAttacks);
  app.get("/planets/:id/campaigns", Planets.getPlanetCampaigns);
}
