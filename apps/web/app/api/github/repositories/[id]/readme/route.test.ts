import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/github/queries", () => ({ getReadmeEvidenceForRepository: vi.fn() }));

import { auth } from "@/lib/auth";
import { getReadmeEvidenceForRepository } from "@/lib/github/queries";
import { GET } from "@/app/api/github/repositories/[id]/readme/route";

const authMock = auth as unknown as Mock;
const queryMock = getReadmeEvidenceForRepository as unknown as Mock;

describe("GET /api/github/repositories/:id/readme", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects unauthenticated requests", async () => {
    authMock.mockResolvedValue(null);
    expect((await GET(new Request("http://localhost"), { params: Promise.resolve({ id: "repo-1" }) })).status).toBe(401);
  });

  it("does not expose another user's repository evidence", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    queryMock.mockResolvedValue(null);
    const response = await GET(new Request("http://localhost"), { params: Promise.resolve({ id: "repo-2" }) });
    expect(response.status).toBe(404);
    expect(queryMock).toHaveBeenCalledWith("user-1", "repo-2");
  });

  it("rejects malformed ids before querying", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    expect((await GET(new Request("http://localhost"), { params: Promise.resolve({ id: "../../other" }) })).status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });
});
