import {
  FIELD_LABELS,
} from "@/lib/domain/field-metadata";
import type {
  FieldComparisonResult,
  VerificationReport,
} from "@/lib/domain/types";

import { FieldVerdictBadge } from "@/components/verification/FieldVerdictBadge";

type Props = {
  report: VerificationReport;
  sourceFileName: string | null;
  mismatchCount: number;
};

export function ComparisonResultsSection({
  report,
  sourceFileName,
  mismatchCount,
}: Props) {
  return (
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
          {sourceFileName ? (
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Source file:{" "}
              <span className="break-all">{sourceFileName}</span>
            </p>
          ) : null}
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Engine: <strong>{report.ocr.engine}</strong>
            {report.ocr.note ? ` (${report.ocr.note})` : ""}
          </p>
        </div>
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {mismatchCount === 0
            ? "All checks matched."
            : `${mismatchCount} field check(s) require attention.`}
        </p>
      </div>

      {report.ocr.extractedTextPreview ? (
        <div className="mt-4 rounded-lg bg-zinc-50 p-4 text-xs text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">
            Extracted text preview
          </p>
          <p className="mt-2 whitespace-pre-wrap break-words">
            {report.ocr.extractedTextPreview}
          </p>
        </div>
      ) : null}

      <ul className="mt-6 space-y-4">
        {report.fields.map((row: FieldComparisonResult) => (
          <li
            className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
            key={row.field}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                {FIELD_LABELS[row.field]}
              </span>
              <FieldVerdictBadge verdict={row.verdict} />
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
  );
}
