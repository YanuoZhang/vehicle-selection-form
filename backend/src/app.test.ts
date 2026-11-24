import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";

describe("GET /api/health", () => {
  it("responds with status ok", async () => {
    const res = await request(createApp()).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("unknown API routes", () => {
  it.each([
    ["GET", "/api/nope"],
    ["GET", "/api/submissions"],
    ["GET", "/api/vehicles"],
  ])("%s %s returns a JSON 404", async (_method, path) => {
    const res = await request(createApp()).get(path);

    expect(res.status).toBe(404);
    expect(res.type).toBe("application/json");
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});
