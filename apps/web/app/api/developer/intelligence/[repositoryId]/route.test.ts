import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/github/queries", () => ({ getRepositoryIntelligenceForUser: vi.fn() }));

import { auth } from "@/lib/auth";
import { getRepositoryIntelligenceForUser } from "@/lib/github/queries";
import { GET } from "@/app/api/developer/intelligence/[repositoryId]/route";

const authMock = auth as unknown as Mock;
const queryMock = getRepositoryIntelligenceForUser as unknown as Mock;

describe("GET /api/developer/intelligence/:repositoryId", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires a session", async () => {
    authMock.mockResolvedValue(null);
    const response = await GET(new Request("http://localhost"), { params: Promise.resolve({ repositoryId: "repo-1" }) });
    expect(response.status).toBe(401);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("scopes the repository query to the authenticated owner", async () => {
    authMock.mockResolvedValue({ user: { id: "owner-1" } });
    queryMock.mockResolvedValue(null);
    const response = await GET(new Request("http://localhost"), { params: Promise.resolve({ repositoryId: "repo-from-another-user" }) });
    expect(response.status).toBe(404);
    expect(queryMock).toHaveBeenCalledWith("owner-1", "repo-from-another-user");
  });

  it("returns an explicit not-analyzed state for an owned repository without analysis", async () => {
    authMock.mockResolvedValue({ user: { id: "owner-1" } });
    queryMock.mockResolvedValue({ repositoryId: "repo-1", name: "owned", fullName: "owner/owned", analysis: null });
    const response = await GET(new Request("http://localhost"), { params: Promise.resolve({ repositoryId: "repo-1" }) });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ intelligence: { repositoryId: "repo-1", name: "owned", fullName: "owner/owned", analysis: null } });
  });
});
