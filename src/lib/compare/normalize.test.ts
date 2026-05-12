import { describe, expect, it } from "vitest";

import {
  normalizeFuzzy,
  normalizeStrict,
  normalizeWhitespace,
} from "@/lib/compare/normalize";

describe("normalizeWhitespace", () => {
  it("collapses internal ASCII whitespace and trims", () => {
    expect(normalizeWhitespace("  a  \t\n  b  ")).toBe("a b");
  });

  it("collapses unicode line separators", () => {
    expect(normalizeWhitespace("x\u2028\u2029y")).toBe("x y");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(normalizeWhitespace(" \n\t ")).toBe("");
  });
});

describe("normalizeStrict", () => {
  it("preserves case while collapsing whitespace", () => {
    expect(normalizeStrict(" OLD\tTOM ")).toBe("OLD TOM");
  });
});

describe("normalizeFuzzy", () => {
  it("lowercases and strips punctuation between tokens", () => {
    expect(normalizeFuzzy("OLD!!! TOM???")).toBe("old tom");
  });

  it("strips punctuation between letters commonly mangled by OCR", () => {
    expect(normalizeFuzzy("Foo-Bar™ Distillery.")).toBe("foobar distillery");
  });

  it("returns empty for punctuation-only string", () => {
    expect(normalizeFuzzy("... ---")).toBe("");
  });
});
