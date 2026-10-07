import { describe, expect, it } from "vitest";
import { sha256 } from "./hash";

describe("intelligence evidence hashes", () => {
  it("is stable across object key order and changes when evidence changes", () => {
    expect(sha256({ b: 2, a: 1 })).toBe(sha256({ a: 1, b: 2 }));
    expect(sha256({ a: 1 })).not.toBe(sha256({ a: 2 }));
  });
});
