import { describe, expect, it } from "vitest";

import {
  evaluateGovernmentWarning,
  GOVERNMENT_WARNING_BANNER,
} from "@/lib/compare/government-warning";
import { CANONICAL_GOVERNMENT_WARNING } from "@/lib/domain/constants";

describe("evaluateGovernmentWarning", () => {
  it("returns uncertain when application warning empty", () => {
    const result = evaluateGovernmentWarning("", CANONICAL_GOVERNMENT_WARNING);
    expect(result.verdict).toBe("uncertain");
    expect(result.detail).toContain("Application warning missing");
  });

  it("returns uncertain when application only whitespace", () => {
    const result = evaluateGovernmentWarning(
      " \n\t ",
      CANONICAL_GOVERNMENT_WARNING,
    );
    expect(result.verdict).toBe("uncertain");
  });

  it("returns uncertain when label text empty", () => {
    const result = evaluateGovernmentWarning(
      CANONICAL_GOVERNMENT_WARNING,
      "",
    );
    expect(result.verdict).toBe("uncertain");
    expect(result.detail).toContain("readable label text");
  });

  it("returns mismatch when banner substring wrong casing", () => {
    const label = CANONICAL_GOVERNMENT_WARNING.replace(
      GOVERNMENT_WARNING_BANNER,
      "Government Warning:",
    );
    const result = evaluateGovernmentWarning(CANONICAL_GOVERNMENT_WARNING, label);
    expect(result.verdict).toBe("mismatch");
    expect(result.detail).toContain(GOVERNMENT_WARNING_BANNER);
  });

  it("returns mismatch when banner absent entirely", () => {
    const label = CANONICAL_GOVERNMENT_WARNING.replace(
      GOVERNMENT_WARNING_BANNER,
      "",
    );
    const result = evaluateGovernmentWarning(CANONICAL_GOVERNMENT_WARNING, label);
    expect(result.verdict).toBe("mismatch");
  });

  it("matches exact canonical label body after whitespace normalize", () => {
    const spaced = CANONICAL_GOVERNMENT_WARNING.replace("(2)", "\n\n(2)");
    expect(
      evaluateGovernmentWarning(CANONICAL_GOVERNMENT_WARNING, spaced).verdict,
    ).toBe("match");
  });

  it("matches when punctuation differs but collapsed uppercase bodies equal", () => {
    const app =
      "GOVERNMENT WARNING: (1) HELLO THERE. (2) GOODBYE THERE.";
    const label =
      "GOVERNMENT WARNING: (1) HELLO THERE… (2) GOODBYE THERE!";
    const result = evaluateGovernmentWarning(app, label);
    expect(result.verdict).toBe("match");
    expect(result.detail).toContain("punctuation-insensitive");
  });

  it("returns uncertain on OCR-like typo with strong prefix overlap (real-world DUSE case)", () => {
    const labelTypo = CANONICAL_GOVERNMENT_WARNING.replace(
      "DURING PREGNANCY BECAUSE OF THE RISK",
      "DURING PREGNANCY DUSE OF THE RISK",
    );
    const result = evaluateGovernmentWarning(
      CANONICAL_GOVERNMENT_WARNING,
      labelTypo,
    );
    expect(result.verdict).toBe("uncertain");
    expect(result.detail).toContain("Partial overlap");
  });

  it("returns mismatch when banner present but bodies diverge without usable overlap", () => {
    const appUnique =
      "GOVERNMENT WARNING: (1) UNIQUE ALPHA BRAVO CHARLIE DELTA ECHO FOXTROT. (2) NO MATCH SECTION HERE.";
    const label = `${GOVERNMENT_WARNING_BANNER} completely unrelated omega pi rho sigma ending text`;
    const result = evaluateGovernmentWarning(appUnique, label);
    expect(result.verdict).toBe("mismatch");
    expect(result.detail).toContain("does not match");
  });

  it("matches when label equals application warning exactly from banner onward", () => {
    const result = evaluateGovernmentWarning(
      CANONICAL_GOVERNMENT_WARNING,
      CANONICAL_GOVERNMENT_WARNING,
    );
    expect(result.verdict).toBe("match");
    expect(result.detail).toBeUndefined();
  });
});
