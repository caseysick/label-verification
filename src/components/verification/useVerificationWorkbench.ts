"use client";

import { useCallback, useMemo, useState } from "react";

import { buildDemoApplication } from "@/lib/compare/compare-fields";
import { ALLOWED_IMAGE_MIME_TYPES } from "@/lib/domain/constants";
import type { ApplicationPayload, VerificationReport } from "@/lib/domain/types";
import { fileToBase64 } from "@/lib/browser/file-to-base64";

import type {
  ExtractionMode,
  OcrQueueRow,
} from "@/lib/workbench/types";

const ALLOWED_SET = new Set<string>(ALLOWED_IMAGE_MIME_TYPES);

export function useVerificationWorkbench() {
  const [application, setApplication] = useState<ApplicationPayload>(() =>
    buildDemoApplication(),
  );
  const [extractionMode, setExtractionMode] =
    useState<ExtractionMode>("manual");
  const [pasteText, setPasteText] = useState("");
  const [ocrImageFiles, setOcrImageFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<VerificationReport | null>(null);
  const [reportSourceFileName, setReportSourceFileName] = useState<
    string | null
  >(null);
  const [liveMessage, setLiveMessage] = useState("");
  const [batchRows, setBatchRows] = useState<OcrQueueRow[]>([]);
  const [selectedBatchIndex, setSelectedBatchIndex] = useState<number | null>(
    null,
  );

  const speak = useCallback((msg: string) => {
    setLiveMessage(msg);
  }, []);

  const handleFieldChange = useCallback(
    (key: keyof ApplicationPayload, value: string) => {
      setApplication((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const verifyPayload = useCallback(
    async (opts: {
      mode: ExtractionMode;
      extractedLabelText?: string;
      image?: { base64: string; mimeType: string };
    }) => {
      const body = {
        application,
        extractionMode: opts.mode,
        extractedLabelText: opts.extractedLabelText,
        imageBase64: opts.image?.base64,
        imageMimeType: opts.image?.mimeType,
      };

      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const payload = (await response.json()) as
        | VerificationReport
        | { error?: string };

      if (!response.ok || !("fields" in payload)) {
        throw new Error(
          "error" in payload && payload.error
            ? String(payload.error)
            : `Request failed (${response.status})`,
        );
      }

      return payload;
    },
    [application],
  );

  const runOcrBatch = useCallback(
    async (files: File[]) => {
      setBusy(true);
      setReport(null);
      setReportSourceFileName(null);
      setSelectedBatchIndex(null);
      setBatchRows(
        files.map((file) => ({ name: file.name, status: "pending" })),
      );
      speak(
        files.length === 1
          ? "Starting OCR on 1 label image."
          : `Starting OCR on ${files.length} label images.`,
      );

      try {
        let firstUploadedReport: VerificationReport | undefined;
        let firstUploadedName: string | undefined;

        for (let i = 0; i < files.length; i += 1) {
          const file = files[i]!;
          setBatchRows((rows) =>
            rows.map((row, idx) =>
              idx === i ? { ...row, status: "running" } : row,
            ),
          );

          try {
            const base64 = await fileToBase64(file);
            const next = await verifyPayload({
              mode: "ocr",
              image: { base64, mimeType: file.type },
            });

            const mismatches = next.fields.filter((f) => f.verdict !== "match")
              .length;
            setReport(next);
            setReportSourceFileName(file.name);
            if (i === 0) {
              firstUploadedReport = next;
              firstUploadedName = file.name;
            }
            setBatchRows((rows) =>
              rows.map((row, idx) =>
                idx === i
                  ? {
                      ...row,
                      status: "done",
                      report: next,
                      detail:
                        mismatches === 0
                          ? "All field checks matched"
                          : `${mismatches} field check(s) need attention`,
                    }
                  : row,
              ),
            );
          } catch (error) {
            setBatchRows((rows) =>
              rows.map((row, idx) =>
                idx === i
                  ? {
                      ...row,
                      status: "error",
                      detail:
                        error instanceof Error ? error.message : "OCR error",
                    }
                  : row,
              ),
            );
          }
        }

        if (files.length > 0) {
          setSelectedBatchIndex(0);
          if (firstUploadedReport !== undefined && firstUploadedName !== undefined) {
            setReport(firstUploadedReport);
            setReportSourceFileName(firstUploadedName);
          } else {
            setReport(null);
            setReportSourceFileName(null);
          }
        }

        speak("OCR verification finished.");
      } finally {
        setBusy(false);
      }
    },
    [speak, verifyPayload],
  );

  const onVerify = useCallback(async () => {
    speak("Verification started.");
    try {
      if (extractionMode === "manual") {
        setBusy(true);
        setReport(null);
        setReportSourceFileName(null);
        setSelectedBatchIndex(null);
        setBatchRows([]);
        const next = await verifyPayload({
          mode: "manual",
          extractedLabelText: pasteText,
        });
        setReport(next);
        speak("Verification finished.");
        return;
      }

      if (!ocrImageFiles.length) {
        speak("Select one or more label images before running OCR.");
        return;
      }

      const invalid = ocrImageFiles.find((f) => !ALLOWED_SET.has(f.type));
      if (invalid) {
        speak(`Unsupported image type on file ${invalid.name}.`);
        return;
      }

      await runOcrBatch(ocrImageFiles);
    } catch (e) {
      speak(e instanceof Error ? e.message : "Verification failed.");
    } finally {
      setBusy(false);
    }
  }, [
    extractionMode,
    ocrImageFiles,
    pasteText,
    runOcrBatch,
    speak,
    verifyPayload,
  ]);

  const displayedReport = useMemo(() => {
    if (
      selectedBatchIndex !== null &&
      batchRows[selectedBatchIndex]?.status === "done" &&
      batchRows[selectedBatchIndex]?.report
    ) {
      return batchRows[selectedBatchIndex]!.report!;
    }
    return report;
  }, [batchRows, report, selectedBatchIndex]);

  const displayedSourceName = useMemo(() => {
    if (
      selectedBatchIndex !== null &&
      batchRows[selectedBatchIndex]?.report !== undefined
    ) {
      return batchRows[selectedBatchIndex]!.name;
    }
    return reportSourceFileName;
  }, [batchRows, reportSourceFileName, selectedBatchIndex]);

  const mismatchCount = displayedReport
    ? displayedReport.fields.filter((row) => row.verdict !== "match").length
    : 0;

  const canSubmit =
    extractionMode === "manual"
      ? Boolean(pasteText.trim())
      : ocrImageFiles.length > 0;

  const submitLabel =
    extractionMode === "ocr" ? "Run OCR" : "Run verification";

  return {
    liveMessage,
    application,
    handleFieldChange,
    resetDemoApplication: () => setApplication(buildDemoApplication()),
    extractionMode,
    setExtractionMode,
    pasteText,
    setPasteText,
    ocrImageFiles,
    setOcrImageFiles,
    busy,
    onVerify,
    batchRows,
    selectedBatchIndex,
    setSelectedBatchIndex,
    displayedReport,
    displayedSourceName,
    mismatchCount,
    canSubmit,
    submitLabel,
  };
}
