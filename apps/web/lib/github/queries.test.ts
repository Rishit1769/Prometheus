import { describe, expect, it, vi } from "vitest";
import { getRepositoryIntelligenceForUser } from "./queries";

describe("repository intelligence queries", () => {
  it("scopes repository analysis by both repository id and authenticated user id", async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    await getRepositoryIntelligenceForUser("owner-1", "repo-2", { repository: { findFirst } } as never);
    expect(findFirst).toHaveBeenCalledWith({
      where: { id: "repo-2", userId: "owner-1" },
      select: { id: true, name: true, fullName: true, analysis: true },
    });
  });

  it("preserves the explicit not-analyzed state for an owned repository", async () => {
    const repository = { id: "repo-2", name: "owned", fullName: "owner/owned", analysis: null };
    const findFirst = vi.fn().mockResolvedValue(repository);
    const result = await getRepositoryIntelligenceForUser("owner-1", "repo-2", { repository: { findFirst } } as never);
    expect(result).toEqual({ repositoryId: "repo-2", name: "owned", fullName: "owner/owned", analysis: null });
  });

  it("does not expose stale or failed analysis output as a current result", async () => {
    const findFirst = vi.fn().mockResolvedValue({
      id: "repo-3",
      name: "stale",
      fullName: "owner/stale",
      analysis: { status: "STALE", output: { summary: "old result" }, errorMessage: "Evidence changed." },
    });
    const result = await getRepositoryIntelligenceForUser("owner-1", "repo-3", { repository: { findFirst } } as never);
    expect(result?.analysis).toMatchObject({ status: "STALE", output: null, errorMessage: "Evidence changed." });
  });
});
