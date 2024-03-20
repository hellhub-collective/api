import app from "../../src";
import type { Planet } from "@prisma/client";
import { describe, expect, it } from "bun:test";

describe("Planet endpoints work as expected", () => {
  it("GET /planets", async () => {
    const response = await app.request("/api/planets");
    const json: { data: Planet[]; error: object | null } =
      (await response.json()) as any;
    expect(response.status).toBe(200);
    expect(json).toHaveProperty("data");
    expect(json.data).toBeInstanceOf(Array);
  });

  it("GET /planets/:id", async () => {
    const response = await app.request("/api/planets/1");
    const json: { data: Planet; error: object | null } =
      (await response.json()) as any;
    expect(response.status).toBe(200);
    expect(json).toHaveProperty("data");
    expect(json.data).toHaveProperty("id");
  });

  it("GET /planets/:id/owners", async () => {
    const response = await app.request("/api/planets/16/owners");
    const json: { data: Record<any, any>; error: object | null } =
      (await response.json()) as any;
    expect(response.status).toBe(200);
    expect(json).toHaveProperty("data");
    expect(json.data).toHaveProperty("owner");
    expect(json.data).toHaveProperty("initialOwner");
    expect(json.data.owner).toHaveProperty("id");
    expect(json.data.initialOwner).toHaveProperty("id");
  });

  it("GET /planets/:id/attacks", async () => {
    const response = await app.request("/api/planets/1/attacks");
    const json: { data: Record<any, any>; error: object | null } =
      (await response.json()) as any;
    expect(response.status).toBe(200);
    expect(json).toHaveProperty("data");
    expect(json.data).toHaveProperty("attacking");
    expect(json.data).toHaveProperty("defending");
    expect(json.data.defending).toBeInstanceOf(Array);
    expect(json.data.attacking).toBeInstanceOf(Array);
  });

  it("GET /planets/:id/campaigns", async () => {
    const response = await app.request("/api/planets/1/campaigns");
    const json: { data: Planet[]; error: object | null } =
      (await response.json()) as any;
    expect(response.status).toBe(200);
    expect(json).toHaveProperty("data");
    expect(json.data).toBeInstanceOf(Array);
  });
});
