import { describe, expect, it } from "vitest";

import { computeFuzzyTokenOverlapRatio } from "@/lib/compare/fuzzy-token-overlap";
import {
  FUZZY_OVERLAP_MATCH_THRESHOLD,
  FUZZY_OVERLAP_UNCERTAIN_THRESHOLD,
  FUZZY_TOKEN_MIN_LENGTH,
} from "@/lib/compare/thresholds";

describe("computeFuzzyTokenOverlapRatio", () => {
  it("returns 1 when all tokens appear in label junk", () => {
    const ratio = computeFuzzyTokenOverlapRatio(
      "FOO BAR BAZ",
      "zzz foo yyy bar xxx baz www",
    );
    expect(ratio).toBe(1);
  });

  it("returns 0 when no tokens meet minimum length", () => {
    expect(computeFuzzyTokenOverlapRatio("a b", "a b c")).toBe(0);
  });

  it("ignores tokens shorter than FUZZY_TOKEN_MIN_LENGTH", () => {
    expect(FUZZY_TOKEN_MIN_LENGTH).toBeGreaterThanOrEqual(3);
    const ratio = computeFuzzyTokenOverlapRatio(
      "ab cd efgh",
      "efgh noise",
    );
    expect(ratio).toBe(1);
  });

  it("boundary: just below uncertain threshold for four-token brand", () => {
    const application = "AAAA BBBB CCCC DDDD";
    const twoOfFour = computeFuzzyTokenOverlapRatio(
      application,
      "aaaa bbbb junk",
    );
    expect(twoOfFour).toBe(0.5);
    expect(twoOfFour).toBeGreaterThanOrEqual(FUZZY_OVERLAP_UNCERTAIN_THRESHOLD);
    expect(twoOfFour).toBeLessThan(FUZZY_OVERLAP_MATCH_THRESHOLD);
  });

  it("boundary: at match threshold for four-token brand", () => {
    const application = "AAAA BBBB CCCC DDDD";
    const threeOfFour = computeFuzzyTokenOverlapRatio(
      application,
      "aaaa bbbb cccc noise",
    );
    expect(threeOfFour).toBe(0.75);
    expect(threeOfFour).toBeGreaterThanOrEqual(FUZZY_OVERLAP_MATCH_THRESHOLD);
  });

  it("returns 0 when label empty after normalization", () => {
    expect(computeFuzzyTokenOverlapRatio("HELLO WORLD", "...")).toBe(0);
  });
});
