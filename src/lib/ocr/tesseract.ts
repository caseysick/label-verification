import "server-only";

import { createWorker } from "tesseract.js";

import type { OcrResult } from "@/lib/ocr/types";

export async function extractWithTesseract(
  buffer: Buffer,
  timeoutMs: number,
): Promise<OcrResult> {
  let worker: Awaited<ReturnType<typeof createWorker>> | undefined;

  try {
    worker = await createWorker("eng");

    const recognition = worker.recognize(buffer);

    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("ocr-timeout")), timeoutMs);
    });

    const result = await Promise.race([recognition, timeout]);
    await worker.terminate();
    worker = undefined;

    const text = result.data.text.trim();
    if (!text) {
      return { ok: false, reason: "failed", detail: "OCR returned no text." };
    }

    return { ok: true, text, engine: "tesseract" };
  } catch (error) {
    if (worker) {
      await worker.terminate().catch(() => undefined);
    }

    if (error instanceof Error && error.message === "ocr-timeout") {
      return { ok: false, reason: "timeout", detail: "OCR exceeded time budget." };
    }

    return {
      ok: false,
      reason: "failed",
      detail: error instanceof Error ? error.message : "OCR failed",
    };
  }
}
