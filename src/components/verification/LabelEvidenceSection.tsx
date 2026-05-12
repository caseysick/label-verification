import { ALLOWED_IMAGE_MIME_TYPES } from "@/lib/domain/constants";
import type {
  ExtractionMode,
  OcrQueueRow,
} from "@/lib/workbench/types";

import { OcrUploadQueueTable } from "@/components/verification/OcrUploadQueueTable";

type Props = {
  extractionMode: ExtractionMode;
  onExtractionModeChange: (mode: ExtractionMode) => void;
  pasteText: string;
  onPasteTextChange: (value: string) => void;
  onOcrFilesSelected: (files: File[]) => void;
  busy: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
  submitLabel: string;
  batchRows: OcrQueueRow[];
  selectedBatchIndex: number | null;
  onSelectBatchRow: (index: number) => void;
};

export function LabelEvidenceSection({
  extractionMode,
  onExtractionModeChange,
  pasteText,
  onPasteTextChange,
  onOcrFilesSelected,
  busy,
  canSubmit,
  onSubmit,
  submitLabel,
  batchRows,
  selectedBatchIndex,
  onSelectBatchRow,
}: Props) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Label evidence
      </h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Paste label text (recommended for demos) or upload label images for
        bundled server OCR. Multiple images share the same application fields;
        each file is verified separately; nothing is merged across uploads.
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
            onChange={() => onExtractionModeChange("manual")}
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
            onChange={() => onExtractionModeChange("ocr")}
            type="radio"
            value="ocr"
          />
          <span>
            <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Server OCR (bundled Tesseract)
            </span>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Runs on this server (no paid Vision API). Large images may time out
              on hobby hosts. Choose one or more images; each is processed in
              order with status below.
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
            onChange={(event) => onPasteTextChange(event.target.value)}
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
            Label images (PNG, JPEG, WebP, GIF; max ~4&nbsp;MB encoded each)
          </label>
          <input
            accept={ALLOWED_IMAGE_MIME_TYPES.join(",")}
            className="min-h-11 text-sm text-zinc-800 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700 dark:text-zinc-200"
            id="label-image"
            multiple
            onChange={(event) =>
              onOcrFilesSelected(Array.from(event.target.files ?? []))
            }
            type="file"
          />
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          className="inline-flex min-h-11 min-w-[11rem] items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          disabled={busy || !canSubmit}
          onClick={() => void onSubmit()}
          type="button"
        >
          {busy ? "Running…" : submitLabel}
        </button>
      </div>

      <OcrUploadQueueTable
        onSelectRow={onSelectBatchRow}
        rows={batchRows}
        selectedBatchIndex={selectedBatchIndex}
      />
    </section>
  );
}
