import { describe, expect, it } from "vitest";

import {
  compareOnlyRequestSchema,
  decodeBase64Image,
  verifyRequestSchema,
} from "@/lib/api/schemas";
import { MAX_IMAGE_BYTES } from "@/lib/domain/constants";
import { buildDemoApplication } from "@/lib/compare/compare-fields";

const minimalApp = () => buildDemoApplication();

describe("decodeBase64Image", () => {
  it("rejects empty input", () => {
    const result = decodeBase64Image("");
    expect("error" in result).toBe(true);
    if ("error" in result) expect(result.error).toContain("empty");
  });

  it("accepts raw base64 payload", () => {
    const raw = Buffer.from("hello-world-bytes").toString("base64");
    const result = decodeBase64Image(raw);
    expect("buffer" in result).toBe(true);
    if ("buffer" in result) {
      expect(result.buffer.equals(Buffer.from("hello-world-bytes"))).toBe(
        true,
      );
    }
  });

  it("strips data URL prefix before decoding", () => {
    const b64 = Buffer.from("png-bytes").toString("base64");
    const result = decodeBase64Image(`data:image/png;base64,${b64}`);
    expect("buffer" in result).toBe(true);
  });

  it("rejects payloads larger than MAX_IMAGE_BYTES", () => {
    const big = Buffer.alloc(MAX_IMAGE_BYTES + 1, 7).toString("base64");
    const result = decodeBase64Image(big);
    expect("error" in result).toBe(true);
    if ("error" in result) expect(result.error).toContain("maximum size");
  });
});

describe("verifyRequestSchema", () => {
  const validManualBody = {
    application: minimalApp(),
    extractionMode: "manual" as const,
    extractedLabelText: "sample",
  };

  it("accepts manual mode without image fields", () => {
    expect(() => verifyRequestSchema.parse(validManualBody)).not.toThrow();
  });

  it("rejects OCR mode without image fields", () => {
    const parsed = verifyRequestSchema.safeParse({
      ...validManualBody,
      extractionMode: "ocr",
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts OCR mode with image payload keys", () => {
    const parsed = verifyRequestSchema.safeParse({
      application: minimalApp(),
      extractionMode: "ocr",
      imageBase64: Buffer.from("x").toString("base64"),
      imageMimeType: "image/png",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects OCR timeout above ceiling", () => {
    const parsed = verifyRequestSchema.safeParse({
      application: minimalApp(),
      extractionMode: "manual",
      ocrTimeoutMs: 200_000,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects invalid MIME enum", () => {
    const parsed = verifyRequestSchema.safeParse({
      application: minimalApp(),
      extractionMode: "ocr",
      imageBase64: "QQ==",
      imageMimeType: "application/pdf",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("compareOnlyRequestSchema", () => {
  it("requires extractedLabelText key present", () => {
    const parsed = compareOnlyRequestSchema.safeParse({
      application: minimalApp(),
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts empty extractedLabelText string", () => {
    const parsed = compareOnlyRequestSchema.safeParse({
      application: minimalApp(),
      extractedLabelText: "",
    });
    expect(parsed.success).toBe(true);
  });
});
