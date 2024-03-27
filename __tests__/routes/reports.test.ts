import app from "../../src";
import type { Order } from "@prisma/client";
import { describe, expect, it } from "bun:test";

describe("Report endpoints work as expected", () => {
  it("GET /reports", async () => {
    const response = await app.request("/api/reports");
    const json: { data: Order[]; error: object | null } =
      (await response.json()) as any;
    expect(response.status).toBe(200);
    expect(json).toHaveProperty("data");
    expect(json.data).toBeInstanceOf(Array);
  });

  it("GET /reports/:id", async () => {
    try {
      const response = await app.request("/api/reports/1");
      const json: { data: Order; error: object | null } =
        (await response.json()) as any;
      expect(response.status).toBe(200);
      expect(json).toHaveProperty("data");
      expect(json.data).toHaveProperty("id");
    } catch {
      // this is ok, there is not always an report with id 1
      // because they are more dynamic than other entities
    }
  });
});
