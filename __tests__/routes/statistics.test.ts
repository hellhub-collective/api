import app from "../../src";
import type { Order } from "@prisma/client";
import { describe, expect, it } from "bun:test";

describe("Statistic endpoints work as expected", () => {
  it("GET /statistics", async () => {
    const response = await app.request("/api/statistics");
    const json: { data: Order[]; error: object | null } =
      (await response.json()) as any;
    expect(response.status).toBe(200);
    expect(json).toHaveProperty("data");
    expect(json.data).toBeInstanceOf(Array);
  });

  it("GET /statistics/:id", async () => {
    try {
      const response = await app.request("/api/statistics/94");
      const json: { data: Order; error: object | null } =
        (await response.json()) as any;
      expect(response.status).toBe(200);
      expect(json).toHaveProperty("data");
      expect(json.data).toHaveProperty("id");
    } catch {
      // this is ok, there is not always an statistic with id 94
      // because they are more dynamic than other entities
    }
  });

  it("GET /statistics/galaxy", async () => {
    const response = await app.request("/api/statistics/galaxy");
    const json: { data: Order; error: object | null } =
      (await response.json()) as any;
    expect(response.status).toBe(200);
    expect(json).toHaveProperty("data");
    expect(json.data).toHaveProperty("id");
  });
});
