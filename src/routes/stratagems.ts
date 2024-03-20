import type { Hono } from "hono";

import * as Stratagems from "controllers/stratagems";

export default async function stratagems(app: Hono) {
  app.get("/stratagems", Stratagems.getAllStratagems);
  app.get("/stratagems/:id", Stratagems.getStratagemById);
}
