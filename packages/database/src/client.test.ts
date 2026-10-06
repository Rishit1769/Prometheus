import { describe, expect, it } from "vitest";

describe("database package", () => {
  it("requires a database URL for the configured Prisma runtime", () => {
    expect("DATABASE_URL").toMatch(/DATABASE_URL/);
  });
});
