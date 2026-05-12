import { describe, expect, it } from "vitest";

import { manualExtract } from "@/lib/ocr/noop-manual";

describe("manualExtract", () => {
  it("fails on empty string", () => {
    const result = manualExtract("");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("failed");
  });

  it("fails on whitespace-only string", () => {
    const result = manualExtract("  \n ");
    expect(result.ok).toBe(false);
  });

  it("returns trimmed manual text", () => {
    const result = manualExtract("  hello label  ");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.text).toBe("hello label");
      expect(result.engine).toBe("manual");
    }
  });
});
