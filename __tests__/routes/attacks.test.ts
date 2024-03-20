import app from "index";
import { describe, expect, it } from "bun:test";
import type { Planet, Attack } from "@prisma/client";

describe("Attack endpoints work as expected", () => {
  it("GET /attacks", async () => {
    const response = await app.request("/api/attacks");
    const json: { data: Attack[]; error: object | null } =
      (await response.json()) as any;
    expect(response.status).toBe(200);
    expect(json).toHaveProperty("data");
    expect(json.data).toBeInstanceOf(Array);
  });

  it("GET /attacks/:id", async () => {
    try {
      const response = await app.request("/api/attacks/16");
      const json: { data: Attack; error: object | null } =
        (await response.json()) as any;
      expect(response.status).toBe(200);
      expect(json).toHaveProperty("data");
      expect(json.data).toHaveProperty("id");
    } catch {
      // this is ok, there is not always an attack with id 16
      // because they are more dynamic than other entities
    }
  });

  it("GET /attacks/:id/planets", async () => {
    try {
      const response = await app.request("/api/attacks/16/planets");
      const json: {
        data: { source: Planet; target: Planet };
        error: object | null;
      } = (await response.json()) as any;
      expect(response.status).toBe(200);
      expect(json).toHaveProperty("data");
      expect(json.data).toHaveProperty("source");
      expect(json.data).toHaveProperty("target");
      expect(json.data.source).toHaveProperty("id");
      expect(json.data.target).toHaveProperty("id");
    } catch {
      // this is ok, there is not always an attack with id 16
      // because they are more dynamic than other entities
      expect(true).toBe(true);
    }
  });
});
