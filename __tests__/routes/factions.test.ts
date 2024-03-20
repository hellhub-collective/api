import app from "../../src";
import { describe, expect, it } from "bun:test";
import type { Faction, Order, Planet } from "@prisma/client";

describe("Faction endpoints work as expected", () => {
  it("GET /factions", async () => {
    const response = await app.request("/api/factions");
    const json: { data: Faction[]; error: object | null } =
      (await response.json()) as any;
    expect(response.status).toBe(200);
    expect(json).toHaveProperty("data");
    expect(json.data).toBeInstanceOf(Array);
  });

  it("GET /factions/:id", async () => {
    const response = await app.request("/api/factions/1");
    const json: { data: Faction; error: object | null } =
      (await response.json()) as any;
    expect(response.status).toBe(200);
    expect(json).toHaveProperty("data");
    expect(json.data).toHaveProperty("id");
  });

  it("GET /factions/:id/orders", async () => {
    const response = await app.request("/api/factions/1/orders");
    const json: { data: Order[]; error: object | null } =
      (await response.json()) as any;
    expect(response.status).toBe(200);
    expect(json).toHaveProperty("data");
    expect(json.data).toBeInstanceOf(Array);
  });

  it("GET /factions/:id/origins", async () => {
    const response = await app.request("/api/factions/1/origins");
    const json: { data: Planet; error: object | null } =
      (await response.json()) as any;
    expect(response.status).toBe(200);
    expect(json).toHaveProperty("data");
    expect(json.data).toHaveProperty("id");
  });

  it("GET /factions/:id/planets", async () => {
    const response = await app.request("/api/factions/1/planets");
    const json: { data: Planet[]; error: object | null } =
      (await response.json()) as any;
    expect(response.status).toBe(200);
    expect(json).toHaveProperty("data");
    expect(json.data).toBeInstanceOf(Array);
  });

  it("GET /factions/:id/pushbacks", async () => {
    const response = await app.request("/api/factions/1/pushbacks");
    const json: { data: Planet[]; error: object | null } =
      (await response.json()) as any;
    expect(response.status).toBe(200);
    expect(json).toHaveProperty("data");
    expect(json.data).toBeInstanceOf(Array);
  });
});
