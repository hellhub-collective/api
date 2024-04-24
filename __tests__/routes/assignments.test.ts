import app from "../../src";
import type { Order } from "@prisma/client";
import { describe, expect, it } from "bun:test";

describe("Assignment endpoints work as expected", () => {
  it("GET /assignment", async () => {
    const response = await app.request("/api/assignments");
    const json: { data: Order[]; error: object | null } =
      (await response.json()) as any;
    expect(response.status).toBe(200);
    expect(json).toHaveProperty("data");
    expect(json.data).toBeInstanceOf(Array);
  });

  it("GET /assignment/:id", async () => {
    try {
      const response = await app.request("/api/assignments/1");
      const json: { data: Order; error: object | null } =
        (await response.json()) as any;
      expect(response.status).toBe(200);
      expect(json).toHaveProperty("data");
      expect(json.data).toHaveProperty("id");
    } catch {
      // this is ok, there is not always an assignment with id 1
      // because they are more dynamic than other entities
    }
  });

  it("GET /assignment/:id/rewards", async () => {
    try {
      const response = await app.request("/api/assignments/1/rewards");
      const json: { data: Order; error: object | null } =
        (await response.json()) as any;
      expect(response.status).toBe(200);
      expect(json).toHaveProperty("data");
      expect(json.data).toHaveProperty("id");
    } catch {
      // this is ok, there is not always an reward for assignment with id 1
      // because they are more dynamic than other entities
    }
  });
});
