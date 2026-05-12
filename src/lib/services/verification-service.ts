import "server-only";

import { compareFields } from "@/lib/compare/compare-fields";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  DEFAULT_OCR_TIMEOUT_MS,
} from "@/lib/domain/constants";
import type { ApplicationPayload, VerificationReport } from "@/lib/domain/types";
import { manualExtract } from "@/lib/ocr/noop-manual";
import { extractWithTesseract } from "@/lib/ocr/tesseract";
import {
  VerificationPayloadError,
  VerificationUnsupportedMedia,
} from "@/lib/services/errors";

function previewText(text: string, max = 600): string {
  const compact = text.replace(/\s+/gu, " ").trim();
  return compact.length <= max ? compact : `${compact.slice(0, max)}…`;
}

export async function runVerification(input: {
  application: ApplicationPayload;
  mode: "manual" | "ocr";
  extractedLabelText?: string;
  image?: { buffer: Buffer; mimeType: string };
  ocrTimeoutMs?: number;
}): Promise<VerificationReport> {
  const timeout = input.ocrTimeoutMs ?? DEFAULT_OCR_TIMEOUT_MS;
  let labelText = "";
  let ocr: VerificationReport["ocr"];

  if (input.mode === "manual") {
    const parsed = manualExtract(input.extractedLabelText ?? "");
    if (!parsed.ok) {
      ocr = {
        engine: "none",
        note: parsed.detail ?? "No manual OCR text supplied.",
      };
    } else {
      labelText = parsed.text;
      ocr = {
        engine: "manual",
        extractedTextPreview: previewText(parsed.text),
      };
    }
  } else {
    const media = input.image;
    if (!media) {
      throw new VerificationPayloadError(
        "OCR mode requires an image buffer and MIME type.",
      );
    }

    if (
      !ALLOWED_IMAGE_MIME_TYPES.includes(
        media.mimeType as (typeof ALLOWED_IMAGE_MIME_TYPES)[number],
      )
    ) {
      throw new VerificationUnsupportedMedia();
    }

    const parsed = await extractWithTesseract(media.buffer, timeout);
    if (!parsed.ok) {
      ocr = {
        engine: "none",
        note:
          parsed.reason === "timeout"
            ? "Bundled OCR timed out. Try a smaller image or paste label text manually."
            : (parsed.detail ?? "Bundled OCR failed."),
      };
    } else {
      labelText = parsed.text;
      ocr = {
        engine: "tesseract",
        extractedTextPreview: previewText(parsed.text),
        note: "Bundled Tesseract.js OCR (prototype accuracy limits apply).",
      };
    }
  }

  const fields = compareFields({
    application: input.application,
    labelText,
  });

  return { fields, ocr };
}
