"use client";

import { useCallback, useState } from "react";

import { ALLOWED_IMAGE_MIME_TYPES } from "@/lib/domain/constants";
import {
  FIELD_KEYS,
  FIELD_LABELS,
} from "@/lib/domain/field-metadata";
import type {
  ApplicationPayload,
  FieldComparisonResult,
  FieldVerdict,
  VerificationReport,
} from "@/lib/domain/types";
import { buildDemoApplication } from "@/lib/compare/compare-fields";

type ExtractionMode = "manual" | "ocr";

function verdictBadgeClasses(verdict: FieldVerdict): string {
  switch (verdict) {
    case "match":
      return "bg-emerald-100 text-emerald-900 ring-emerald-600/20 dark:bg-emerald-950 dark:text-emerald-100 dark:ring-emerald-400/30";
    case "mismatch":
      return "bg-red-100 text-red-900 ring-red-600/15 dark:bg-red-950 dark:text-red-100 dark:ring-red-400/25";
    case "uncertain":
      return "bg-amber-100 text-amber-950 ring-amber-600/20 dark:bg-amber-950 dark:text-amber-50 dark:ring-amber-400/25";
    case "missing":
      return "bg-zinc-200 text-zinc-900 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-400/20";
    default:
      return "bg-zinc-100 text-zinc-800 ring-zinc-500/10";
  }
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  return globalThis.btoa(binary);
}

const ALLOWED_SET = new Set<string>(ALLOWED_IMAGE_MIME_TYPES);

export function VerificationWorkbench() {
  const [application, setApplication] = useState<ApplicationPayload>(() =>
    buildDemoApplication(),
  );
  const [extractionMode, setExtractionMode] =
    useState<ExtractionMode>("manual");
  const [pasteText, setPasteText] = useState("");
  const [ocrImageFiles, setOcrImageFiles] = useState<File[]>([]);
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<VerificationReport | null>(null);
  /** Single-image / pasted-text runs (batch rows carry their own reports). */
  const [reportSourceFileName, setReportSourceFileName] = useState<
    string | null
  >(null);
  const [liveMessage, setLiveMessage] = useState("");
  const [batchRows, setBatchRows] = useState<
    {
      name: string;
      status: "pending" | "running" | "done" | "error";
      detail?: string;
      report?: VerificationReport;
    }[]
  >([]);
  /** Which batch row drives the comparison panel (`null` → use standalone `report`). */
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

  /** Sequential server OCR for one or more images; updates batch table + comparison panel. */
  const runOcrBatch = useCallback(
    async (files: File[]) => {
      setBusy(true);
      setReport(null);
      setReportSourceFileName(null);
      setSelectedBatchIndex(null);
      setBatchRows(
        files.map((file) => ({ name: file.name, status: "pending" })),
      );
      speak(`Starting batch of ${files.length} labels.`);

      try {
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
            setSelectedBatchIndex(i);
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
                        error instanceof Error ? error.message : "Batch error",
                    }
                  : row,
              ),
            );
          }
        }

        speak("Batch verification finished.");
      } finally {
        setBusy(false);
      }
    },
    [speak, verifyPayload],
  );

  const onVerifySingle = useCallback(async () => {
    speak("Verification started.");
    try {
      if (extractionMode === "manual") {
        setBusy(true);
        setReport(null);
        setReportSourceFileName(null);
        setSelectedBatchIndex(null);
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

      setReport(null);
      setReportSourceFileName(null);
      setSelectedBatchIndex(null);

      if (ocrImageFiles.length > 1) {
        await runOcrBatch(ocrImageFiles);
        return;
      }

      setBusy(true);
      setBatchRows([]);
      const file = ocrImageFiles[0]!;
      const base64 = await fileToBase64(file);
      const next = await verifyPayload({
        mode: "ocr",
        image: { base64, mimeType: file.type },
      });
      setReport(next);
      speak("Verification finished.");
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

  const onVerifyBatch = useCallback(async () => {
    if (!batchFiles.length) {
      speak("Add one or more images for batch verification.");
      return;
    }

    const invalid = batchFiles.find((f) => !ALLOWED_SET.has(f.type));
    if (invalid) {
      speak(`Unsupported type on file ${invalid.name}.`);
      return;
    }

    await runOcrBatch(batchFiles);
  }, [batchFiles, runOcrBatch, speak]);

  const displayedReport =
    selectedBatchIndex !== null &&
    batchRows[selectedBatchIndex]?.status === "done" &&
    batchRows[selectedBatchIndex]?.report
      ? batchRows[selectedBatchIndex]!.report!
      : report;

  const displayedSourceName =
    selectedBatchIndex !== null &&
    batchRows[selectedBatchIndex]?.report !== undefined
      ? batchRows[selectedBatchIndex]!.name
      : reportSourceFileName;

  const mismatchCount = displayedReport
    ? displayedReport.fields.filter((row) => row.verdict !== "match").length
    : 0;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Assistive prototype (not a COLA replacement)
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Label verification assistant
        </h1>
        <p className="max-w-3xl text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
          This tool compares text extracted from a beverage label image with the
          structured application fields you enter. Results are{" "}
          <strong>assistive only</strong>; reviewers must exercise judgment,
          especially when OCR quality is poor or wording is nuanced.
        </p>
      </header>

      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {liveMessage}
      </div>

      <section
        aria-labelledby="application-heading"
        className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
              id="application-heading"
            >
              Application values
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Match these strings against what appears on the physical label.
            </p>
          </div>
          <button
            className="mt-2 inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-900 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900 sm:mt-0"
            onClick={() => setApplication(buildDemoApplication())}
            type="button"
          >
            Reset demo sample
          </button>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {FIELD_KEYS.map((key) => (
            <div className="flex flex-col gap-1.5" key={key}>
              <label
                className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
                htmlFor={`field-${key}`}
              >
                {FIELD_LABELS[key]}
              </label>
              {key === "governmentWarning" ? (
                <textarea
                  className="min-h-28 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-inner focus-visible:border-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  id={`field-${key}`}
                  onChange={(event) =>
                    handleFieldChange(key, event.target.value)
                  }
                  value={application[key]}
                />
              ) : (
                <input
                  className="min-h-11 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-inner focus-visible:border-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  id={`field-${key}`}
                  onChange={(event) =>
                    handleFieldChange(key, event.target.value)
                  }
                  type="text"
                  value={application[key]}
                />
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Label evidence
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Provide pasted OCR text (recommended for demos) or upload an image
          for bundled Tesseract OCR on the server (accuracy varies).
        </p>

        <fieldset className="mt-5 space-y-3">
          <legend className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Extraction mode
          </legend>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent px-2 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900">
            <input
              checked={extractionMode === "manual"}
              className="mt-1 size-4 accent-blue-600"
              name="extraction-mode"
              onChange={() => setExtractionMode("manual")}
              type="radio"
              value="manual"
            />
            <span>
              <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Manual / pasted label text
              </span>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Fastest path: paste a transcript of the label for trustworthy
                comparisons.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent px-2 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900">
            <input
              checked={extractionMode === "ocr"}
              className="mt-1 size-4 accent-blue-600"
              name="extraction-mode"
              onChange={() => setExtractionMode("ocr")}
              type="radio"
              value="ocr"
            />
            <span>
              <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Server OCR (bundled Tesseract)
              </span>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Runs inside this deployment; no paid Vision API required. Large
                images may time out on hobby hosts.
              </span>
            </span>
          </label>
        </fieldset>

        {extractionMode === "manual" ? (
          <div className="mt-6 flex flex-col gap-2">
            <label
              className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
              htmlFor="paste-text"
            >
              Label text
            </label>
            <textarea
              className="min-h-36 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-inner focus-visible:border-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              id="paste-text"
              onChange={(event) => setPasteText(event.target.value)}
              placeholder="Paste OCR output or type what appears on the label."
              value={pasteText}
            />
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-2">
            <label
              className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
              htmlFor="label-image"
            >
              Label image(s) (PNG, JPEG, WebP, GIF; max ~4&nbsp;MB encoded
              each). Multiple files run as a batch with per-file results below.
            </label>
            <input
              accept={ALLOWED_IMAGE_MIME_TYPES.join(",")}
              className="min-h-11 text-sm text-zinc-800 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700 dark:text-zinc-200"
              id="label-image"
              multiple
              onChange={(event) =>
                setOcrImageFiles(Array.from(event.target.files ?? []))
              }
              type="file"
            />
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            className="inline-flex min-h-11 min-w-[11rem] items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
            disabled={
              busy ||
              (extractionMode === "manual"
                ? !pasteText.trim()
                : ocrImageFiles.length === 0)
            }
            onClick={() => void onVerifySingle()}
            type="button"
          >
            {busy ? "Running…" : "Run verification"}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Batch importer preview
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Runs the same application record against each image separately (nothing
          is merged across files). While processing, the comparison below follows
          the latest file; when finished, use{" "}
          <strong>View comparison</strong> on any completed row to switch between
          files—each row keeps its own OCR snapshot and field results.
        </p>
        <input
          accept={ALLOWED_IMAGE_MIME_TYPES.join(",")}
          className="mt-4 min-h-11 text-sm text-zinc-800 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-zinc-800 dark:text-zinc-200 dark:file:bg-zinc-100 dark:file:text-zinc-900 dark:hover:file:bg-zinc-200"
          multiple
          onChange={(event) =>
            setBatchFiles(Array.from(event.target.files ?? []))
          }
          type="file"
        />
        <button
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-300 px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
          disabled={busy || batchFiles.length === 0}
          onClick={() => void onVerifyBatch()}
          type="button"
        >
          {busy ? "Processing batch…" : "Run batch OCR"}
        </button>

        {batchRows.length > 0 ? (
          <table className="mt-6 w-full border-collapse text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <tr>
                <th className="py-2 pr-4 font-medium">File</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Notes</th>
                <th className="py-2 font-medium">Comparison</th>
              </tr>
            </thead>
            <tbody>
              {batchRows.map((row, index) => (
                <tr
                  className={`border-b border-zinc-100 dark:border-zinc-900 ${
                    selectedBatchIndex === index ? "bg-blue-50/80 dark:bg-blue-950/40" : ""
                  }`}
                  key={`${row.name}-${index}`}
                >
                  <td className="py-3 pr-4 pl-4 font-medium text-zinc-900 dark:text-zinc-100">
                    {row.name}
                  </td>
                  <td className="py-3 pr-4 capitalize text-zinc-700 dark:text-zinc-300">
                    {row.status}
                  </td>
                  <td className="py-3 pr-4 text-zinc-600 dark:text-zinc-400">
                    {row.detail ?? "—"}
                  </td>
                  <td className="py-3">
                    {row.status === "done" && row.report ? (
                      <button
                        className="inline-flex min-h-9 items-center justify-center rounded-lg border border-blue-600 px-3 text-xs font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-blue-500 dark:text-blue-300 dark:hover:bg-blue-950/60"
                        onClick={() => setSelectedBatchIndex(index)}
                        type="button"
                      >
                        View comparison
                      </button>
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>

      {displayedReport ? (
        <section
          aria-labelledby="results-heading"
          className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2
                className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
                id="results-heading"
              >
                Comparison results
              </h2>
              {displayedSourceName ? (
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Source file:{" "}
                  <span className="break-all">{displayedSourceName}</span>
                </p>
              ) : null}
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Engine: <strong>{displayedReport.ocr.engine}</strong>
                {displayedReport.ocr.note ? ` (${displayedReport.ocr.note})` : ""}
              </p>
            </div>
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              {mismatchCount === 0
                ? "All checks matched."
                : `${mismatchCount} field check(s) require attention.`}
            </p>
          </div>

          {displayedReport.ocr.extractedTextPreview ? (
            <div className="mt-4 rounded-lg bg-zinc-50 p-4 text-xs text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                Extracted text preview
              </p>
              <p className="mt-2 whitespace-pre-wrap break-words">
                {displayedReport.ocr.extractedTextPreview}
              </p>
            </div>
          ) : null}

          <ul className="mt-6 space-y-4">
            {displayedReport.fields.map((row: FieldComparisonResult) => (
              <li
                className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                key={row.field}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                    {FIELD_LABELS[row.field]}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset ${verdictBadgeClasses(row.verdict)}`}
                  >
                    {row.verdict}
                  </span>
                </div>
                <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="font-medium text-zinc-500 dark:text-zinc-400">
                      Application value
                    </dt>
                    <dd className="mt-1 whitespace-pre-wrap break-words text-zinc-900 dark:text-zinc-100">
                      {row.applicationDisplay || "none"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-zinc-500 dark:text-zinc-400">
                      Detected on label
                    </dt>
                    <dd className="mt-1 whitespace-pre-wrap break-words text-zinc-900 dark:text-zinc-100">
                      {row.detectedSnippet ?? "none"}
                    </dd>
                  </div>
                </dl>
                {row.detail ? (
                  <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {row.detail}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
