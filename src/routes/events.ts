import type { Hono } from "hono";

import * as Events from "controllers/events";

export default async function events(app: Hono) {
  app.get("/events", Events.getAllEvents);
  app.get("/events/:id", Events.getEventById);
}
