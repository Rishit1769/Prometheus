import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/intelligence/service", () => ({ analyzeDeveloper: vi.fn() }));

import { auth } from "@/lib/auth";
import { analyzeDeveloper } from "@/lib/intelligence/service";
import { POST } from "@/app/api/developer/analyze/route";

const authMock = auth as unknown as Mock;
const analyzeMock = analyzeDeveloper as unknown as Mock;

describe("POST /api/developer/analyze", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects unauthenticated requests", async () => {
    authMock.mockResolvedValue(null);
    const response = await POST();
    expect(response.status).toBe(401);
    expect(analyzeMock).not.toHaveBeenCalled();
  });

  it("uses the session user and exposes only aggregate progress", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    analyzeMock.mockResolvedValue({ repositoriesEligible: 2, repositoriesAnalyzed: 2, repositoriesReused: 1, repositoriesFailed: 0, developerProfileGenerated: true, developerProfileReused: false, coverage: 1, status: "COMPLETE" });
    const response = await POST();
    expect(response.status).toBe(200);
    expect(analyzeMock).toHaveBeenCalledWith("user-1");
    expect(await response.json()).toEqual(expect.objectContaining({ repositoriesEligible: 2, developerProfileGenerated: true }));
  });

  it("sanitizes missing provider configuration", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    analyzeMock.mockRejectedValue(new Error("AI provider is not configured."));
    const response = await POST();
    const body = await response.json();
    expect(response.status).toBe(503);
    expect(body.error.code).toBe("AI_NOT_CONFIGURED");
    expect(JSON.stringify(body)).not.toContain("API_KEY");
  });
});
