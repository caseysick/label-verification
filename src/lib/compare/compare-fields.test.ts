import { describe, expect, it } from "vitest";

import type { ApplicationPayload } from "@/lib/domain/types";
import {
  compareFields,
  buildDemoApplication,
} from "@/lib/compare/compare-fields";
import {
  FUZZY_OVERLAP_MATCH_THRESHOLD,
  FUZZY_OVERLAP_UNCERTAIN_THRESHOLD,
} from "@/lib/compare/thresholds";
import { CANONICAL_GOVERNMENT_WARNING } from "@/lib/domain/constants";

describe("compareFields integration", () => {
  const demo = (overrides: Partial<ApplicationPayload> = {}) =>
    buildDemoApplication(overrides);

  it("matches all fields when label mirrors structured application block", () => {
    const application = demo();
    const label =
      `${application.brandName}\n` +
      `${application.classType}\n` +
      `${application.alcoholContent}\n` +
      `${application.netContents}\n` +
      `${application.producerAddress}\n` +
      `${application.countryOfOrigin}\n` +
      `${application.governmentWarning}`;

    const rows = compareFields({ application, labelText: label });
    expect(rows.every((row) => row.verdict === "match")).toBe(true);
  });

  it("flags government warning when banner casing wrong", () => {
    const application = demo();
    const rows = compareFields({
      application,
      labelText: CANONICAL_GOVERNMENT_WARNING.replace(
        "GOVERNMENT WARNING:",
        "Government Warning:",
      ),
    });
    expect(rows.find((r) => r.field === "governmentWarning")?.verdict).toBe(
      "mismatch",
    );
  });

  it("matches fuzzy brand/class via token overlap when OCR inserts junk", () => {
    const application = demo({
      brandName: "FOO BAR DISTILLERY",
      classType: "Small Batch Moonshine",
    });
    const label =
      "heading foo noise bar extra distillery small batch moonshine footer";

    const rows = compareFields({ application, labelText: label });
    expect(rows.find((r) => r.field === "brandName")?.verdict).toBe("match");
    expect(rows.find((r) => r.field === "classType")?.verdict).toBe("match");
    expect(
      rows.find((r) => r.field === "brandName")?.detail,
    ).toContain("distinctive tokens");
  });

  it("sets fuzzy uncertain between overlap thresholds", () => {
    const application = demo({
      brandName: "AAAA BBBB CCCC DDDD",
      classType: "ZZZZ",
    });
    const ratio = 0.5;
    expect(ratio).toBeGreaterThanOrEqual(FUZZY_OVERLAP_UNCERTAIN_THRESHOLD);
    expect(ratio).toBeLessThan(FUZZY_OVERLAP_MATCH_THRESHOLD);

    const label = "aaaa bbbb unrelated unrelated unrelated";
    const rows = compareFields({ application, labelText: label });
    expect(rows.find((r) => r.field === "brandName")?.verdict).toBe(
      "uncertain",
    );
  });

  it("sets fuzzy mismatch below uncertain threshold", () => {
    const application = demo({
      brandName: "AAAA BBBB CCCC DDDD",
    });
    const label = "aaaa unrelated unrelated unrelated unrelated";
    const rows = compareFields({ application, labelText: label });
    expect(rows.find((r) => r.field === "brandName")?.verdict).toBe(
      "mismatch",
    );
  });

  it("marks empty application field as missing for standard fields", () => {
    const application = demo({ brandName: "" });
    const rows = compareFields({
      application,
      labelText: "anything brand noise old tom",
    });
    expect(rows.find((r) => r.field === "brandName")?.verdict).toBe("missing");
  });

  it("government warning empty on application yields uncertain", () => {
    const application = demo({ governmentWarning: "" });
    const rows = compareFields({
      application,
      labelText: CANONICAL_GOVERNMENT_WARNING,
    });
    expect(rows.find((r) => r.field === "governmentWarning")?.verdict).toBe(
      "uncertain",
    );
  });

  it("whitespace-only label yields uncertain for non-government fields", () => {
    const application = demo();
    const rows = compareFields({ application, labelText: "\n\n  \t  " });
    expect(rows.find((r) => r.field === "brandName")?.verdict).toBe(
      "uncertain",
    );
    expect(rows.find((r) => r.field === "alcoholContent")?.verdict).toBe(
      "uncertain",
    );
  });

  it("strict substring match tolerates extra whitespace in net contents on label", () => {
    const application = demo();
    const label = [
      application.brandName,
      application.classType,
      application.alcoholContent,
      application.netContents.split(" ").join("   "),
      application.producerAddress,
      application.countryOfOrigin,
      application.governmentWarning,
    ].join("\n");

    expect(
      compareFields({ application, labelText: label }).every(
        (row) => row.verdict === "match",
      ),
    ).toBe(true);
  });

  it("provides detectedSnippet fallback on strict mismatch when OCR text exists", () => {
    const application = demo();
    const garbage =
      "Brand name Class type OCR junk 750 Producer Country unrelated blob";
    const rows = compareFields({ application, labelText: garbage });
    const net = rows.find((r) => r.field === "netContents");
    expect(net?.verdict).toBe("mismatch");
    expect(net?.detectedSnippet).toBeDefined();
    expect(net?.detectedSnippet!.length).toBeGreaterThan(0);
  });

  it("surfaces OCR typo government warning as uncertain with snippet", () => {
    const application = demo();
    const labelTypo = CANONICAL_GOVERNMENT_WARNING.replace(
      "DURING PREGNANCY BECAUSE OF THE RISK",
      "DURING PREGNANCY DUSE OF THE RISK",
    );
    const rows = compareFields({ application, labelText: labelTypo });
    const gov = rows.find((r) => r.field === "governmentWarning");
    expect(gov?.verdict).toBe("uncertain");
    expect(gov?.detectedSnippet).toContain("GOVERNMENT WARNING:");
  });

  it("returns seven rows in stable field order", () => {
    const rows = compareFields({ application: demo(), labelText: "x" });
    expect(rows.map((r) => r.field)).toEqual([
      "brandName",
      "classType",
      "alcoholContent",
      "netContents",
      "producerAddress",
      "countryOfOrigin",
      "governmentWarning",
    ]);
  });
});
