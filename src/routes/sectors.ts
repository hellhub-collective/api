import type { Hono } from "hono";

import * as Sectors from "controllers/sectors";

export default async function sectors(app: Hono) {
  app.get("/sectors", Sectors.getAllSectors);
  app.get("/sectors/:id", Sectors.getSectorById);
  app.get("/sectors/:id/planets", Sectors.getPlanetsBySector);
}
