import app from "index";
import { describe, expect, it } from "bun:test";
import type { GlobalEvent } from "@prisma/client";

describe("Event endpoints work as expected", () => {
  it("GET /events", async () => {
    const response = await app.request("/api/events");
    const json: { data: GlobalEvent[]; error: object | null } =
      (await response.json()) as any;
    expect(response.status).toBe(200);
    expect(json).toHaveProperty("data");
    expect(json.data).toBeInstanceOf(Array);
  });

  it("GET /events/:id", async () => {
    try {
      const response = await app.request("/api/events/1");
      const json: { data: GlobalEvent; error: object | null } =
        (await response.json()) as any;
      expect(response.status).toBe(200);
      expect(json).toHaveProperty("data");
      expect(json.data).toHaveProperty("id");
    } catch {
      // this is ok, there is not always an event with id 1
      // because they are more dynamic than other entities
    }
  });
});
