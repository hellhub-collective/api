import app from "index";
import { describe, expect, it } from "bun:test";
import type { Stratagem } from "@prisma/client";

describe("Stratagem endpoints work as expected", () => {
  it("GET /stratagems", async () => {
    const response = await app.request("/api/stratagems");
    const json: { data: Stratagem[]; error: object | null } =
      (await response.json()) as any;
    expect(response.status).toBe(200);
    expect(json).toHaveProperty("data");
    expect(json.data).toBeInstanceOf(Array);
  });

  it("GET /stratagems/:id", async () => {
    const response = await app.request("/api/stratagems/1");
    const json: { data: Stratagem; error: object | null } =
      (await response.json()) as any;
    expect(response.status).toBe(200);
    expect(json).toHaveProperty("data");
    expect(json.data).toHaveProperty("id");
  });
});
