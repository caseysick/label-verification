import type { VerificationReport } from "@/lib/domain/types";

/** Client verification UI: manual paste vs server OCR. */
export type ExtractionMode = "manual" | "ocr";

/** One row in the OCR upload queue (Label evidence). */
export type OcrQueueRow = {
  name: string;
  status: "pending" | "running" | "done" | "error";
  detail?: string;
  report?: VerificationReport;
};
