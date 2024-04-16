import type { Hono } from "hono";

import * as Biomes from "controllers/biomes";

export default async function biomes(app: Hono) {
  app.get("/biomes", Biomes.getAllBiomes);
  app.get("/biomes/:id", Biomes.getBiomeById);
  app.get("/biomes/:id/planets", Biomes.getPlanetsByBiome);
}
