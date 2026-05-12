import type { OcrResult } from "@/lib/ocr/types";

export function manualExtract(text: string): OcrResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, reason: "failed", detail: "Manual OCR text empty." };
  }
  return { ok: true, text: trimmed, engine: "manual" };
}
