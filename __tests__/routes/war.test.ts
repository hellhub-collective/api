import app from "index";
import type { War } from "@prisma/client";
import { describe, expect, it } from "bun:test";

describe("War endpoint work as expected", () => {
  it("GET /war", async () => {
    const response = await app.request("/api/war");
    const json: { data: War; error: object | null } =
      (await response.json()) as any;
    expect(response.status).toBe(200);
    expect(json).toHaveProperty("data");
    expect(json.data).toHaveProperty("id");
  });
});
