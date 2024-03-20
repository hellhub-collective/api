import app from "index";
import { describe, expect, it } from "bun:test";
import type { Planet, Sector } from "@prisma/client";

describe("Sector endpoints work as expected", () => {
  it("GET /sectors", async () => {
    const response = await app.request("/api/sectors");
    const json: { data: Sector[]; error: object | null } =
      (await response.json()) as any;
    expect(response.status).toBe(200);
    expect(json).toHaveProperty("data");
    expect(json.data).toBeInstanceOf(Array);
  });

  it("GET /sectors/:id", async () => {
    const response = await app.request("/api/sectors/1");
    const json: { data: Sector; error: object | null } =
      (await response.json()) as any;
    expect(response.status).toBe(200);
    expect(json).toHaveProperty("data");
    expect(json.data).toHaveProperty("id");
  });

  it("GET /sectors/:id/planets", async () => {
    const response = await app.request("/api/sectors/1/planets");
    const json: { data: Planet[]; error: object | null } =
      (await response.json()) as any;
    expect(response.status).toBe(200);
    expect(json).toHaveProperty("data");
    expect(json.data).toBeInstanceOf(Array);
  });
});
