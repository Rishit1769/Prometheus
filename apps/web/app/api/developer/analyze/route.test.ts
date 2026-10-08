import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/intelligence/service", () => ({ analyzeDeveloper: vi.fn() }));

import { auth } from "@/lib/auth";
import { analyzeDeveloper } from "@/lib/intelligence/service";
import { DeveloperAnalysisFailure } from "@/lib/intelligence/errors";
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
    analyzeMock.mockResolvedValue({ repositoriesEligible: 2, repositoriesAnalyzed: 1, repositoriesReused: 1, repositoriesRevalidated: 0, repositoriesInvalidated: 0, repositoriesRegenerated: 0, repositoriesFailed: 0, developerProfileGenerated: true, developerProfileReused: false, coverage: 1, status: "COMPLETE" });
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

  it("returns actionable safe diagnostics for total repository provider failure", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    analyzeMock.mockRejectedValue(new DeveloperAnalysisFailure({
      stage: "provider",
      code: "WORKSPACE_REGION_REQUIRED",
      providerStatus: 400,
      message: "Select Global in workspace privacy settings.",
    }, 32));

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error.code).toBe("ANALYSIS_PROVIDER_FAILED");
    expect(body.error.diagnostic).toMatchObject({ stage: "provider", code: "WORKSPACE_REGION_REQUIRED", providerStatus: 400, failedRepositories: 32 });
  });
});
