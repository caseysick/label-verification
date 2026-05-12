import { z } from "zod";

import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_BYTES,
} from "@/lib/domain/constants";

export const applicationPayloadSchema = z.object({
  brandName: z.string(),
  classType: z.string(),
  alcoholContent: z.string(),
  netContents: z.string(),
  producerAddress: z.string(),
  countryOfOrigin: z.string(),
  governmentWarning: z.string(),
});

const extractionModeSchema = z.enum(["manual", "ocr"]);

export const verifyRequestSchema = z
  .object({
    application: applicationPayloadSchema,
    extractionMode: extractionModeSchema,
    extractedLabelText: z.string().optional(),
    imageBase64: z.string().optional(),
    imageMimeType: z.enum(ALLOWED_IMAGE_MIME_TYPES).optional(),
    ocrTimeoutMs: z.number().int().positive().max(120_000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.extractionMode === "manual") {
      return;
    }
    if (!data.imageBase64 || !data.imageMimeType) {
      ctx.addIssue({
        code: "custom",
        message:
          "OCR mode requires imageBase64 and imageMimeType (allowed: jpeg, png, webp, gif).",
        path: ["imageBase64"],
      });
    }
  });

export type VerifyRequestInput = z.infer<typeof verifyRequestSchema>;

export function decodeBase64Image(
  base64: string,
): { buffer: Buffer } | { error: string } {
  const trimmed = base64.trim();
  if (!trimmed) {
    return { error: "imageBase64 is empty." };
  }

  let payload = trimmed;
  const dataUrl = /^data:([^;]+);base64,(.+)$/u.exec(trimmed);
  if (dataUrl) {
    payload = dataUrl[2] ?? "";
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(payload, "base64");
  } catch {
    return { error: "imageBase64 is not valid base64." };
  }

  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    return {
      error: `Image exceeds maximum size of ${MAX_IMAGE_BYTES} bytes.`,
    };
  }

  return { buffer };
}

export const compareOnlyRequestSchema = z.object({
  application: applicationPayloadSchema,
  extractedLabelText: z.string(),
});
