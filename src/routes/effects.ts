import type { Hono } from "hono";

import * as Effects from "controllers/effects";

export default async function effects(app: Hono) {
  app.get("/effects", Effects.getAllEffects);
  app.get("/effects/:id", Effects.getEffectById);
  app.get("/effects/:id/planets", Effects.getPlanetsByEffect);
}
