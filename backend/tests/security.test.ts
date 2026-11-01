import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";

describe("protected route security", () => {
  const protectedRoutes = [
    "/api/patients",
    "/api/notifications",
    "/api/appointments",
    "/api/behaviour/questions",
    "/api/care-plans/patient/example",
    "/api/ai/patient/example",
    "/api/admin/users",
  ];

  for (const route of protectedRoutes) {
    it(`blocks anonymous access to ${route}`, async () => {
      const response = await request(app).get(route);
      expect(response.status).toBe(401);
    });
  }

  it("returns public API information", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
    expect(response.body.name).toBe("AAROGYAI API");
  });
});
