import { describe, expect, it } from "vitest";
import { getAuthEnv } from "./env";

describe("auth environment", () => {
  it("reports missing credentials without exposing values", () => {
    expect(getAuthEnv({})).toEqual({ ok: false, missing: ["AUTH_SECRET", "AUTH_GITHUB_ID", "AUTH_GITHUB_SECRET"] });
  });

  it("accepts a complete configuration", () => {
    expect(getAuthEnv({ AUTH_SECRET: "secret", AUTH_GITHUB_ID: "id", AUTH_GITHUB_SECRET: "secret" })).toEqual({ ok: true, missing: [] });
  });
});
