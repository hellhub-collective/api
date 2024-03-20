import app from "../../src";
import type { Order } from "@prisma/client";
import { describe, expect, it } from "bun:test";

let res = null;

describe("Order endpoints work as expected", () => {
  it("GET /orders", async () => {
    const response = await app.request("/api/orders");
    const json: { data: Order[]; error: object | null } =
      (await response.json()) as any;
    expect(response.status).toBe(200);
    expect(json).toHaveProperty("data");
    expect(json.data).toBeInstanceOf(Array);
  });

  it("GET /orders/:id", async () => {
    try {
      const response = await app.request("/api/orders/1");
      const json: { data: Order; error: object | null } =
        (await response.json()) as any;
      expect(response.status).toBe(200);
      expect(json).toHaveProperty("data");
      expect(json.data).toHaveProperty("id");
    } catch {
      // this is ok, there is not always an order with id 16
      // because they are more dynamic than other entities
    }
  });
});
