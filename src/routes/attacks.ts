import type { Hono } from "hono";

import * as Attacks from "controllers/attacks";

export default async function attacks(app: Hono) {
  app.get("/attacks", Attacks.getAllAttacks);
  app.get("/attacks/:id", Attacks.getAttackById);
  app.get("/attacks/:id/planets", Attacks.getPlanetsByAttack);
}
