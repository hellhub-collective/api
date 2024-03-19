import type { Hono } from "hono";

import * as Orders from "controllers/orders";

export default async function events(app: Hono) {
  app.get("/orders", Orders.getAllOrders);
  app.get("/orders/:id", Orders.getOrderById);
}
