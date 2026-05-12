import type { OcrQueueRow } from "@/lib/workbench/types";

type Props = {
  rows: OcrQueueRow[];
  selectedBatchIndex: number | null;
  onSelectRow: (index: number) => void;
};

export function OcrUploadQueueTable({
  rows,
  selectedBatchIndex,
  onSelectRow,
}: Props) {
  if (rows.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        OCR uploads in this run
      </h3>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        While processing, the comparison below updates for each file; when the
        run finishes, the{" "}
        <strong className="font-semibold text-zinc-800 dark:text-zinc-200">
          first
        </strong>{" "}
        upload is selected. Use{" "}
        <strong className="font-semibold text-zinc-800 dark:text-zinc-200">
          View comparison
        </strong>{" "}
        to switch files.
      </p>
      <table className="mt-4 w-full border-collapse text-left text-sm">
        <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <tr>
            <th className="py-2 pl-4 pr-4 font-medium">File</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            <th className="py-2 pr-4 font-medium">Notes</th>
            <th className="py-2 font-medium">Comparison</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              className={`border-b border-zinc-100 dark:border-zinc-900 ${
                selectedBatchIndex === index
                  ? "bg-blue-50/80 dark:bg-blue-950/40"
                  : ""
              }`}
              key={`${row.name}-${index}`}
            >
              <td className="py-3 pl-4 pr-4 font-medium text-zinc-900 dark:text-zinc-100">
                {row.name}
              </td>
              <td className="py-3 pr-4 capitalize text-zinc-700 dark:text-zinc-300">
                {row.status}
              </td>
              <td className="py-3 pr-4 text-zinc-600 dark:text-zinc-400">
                {row.detail ?? "-"}
              </td>
              <td className="py-3">
                {row.status === "done" && row.report ? (
                  <button
                    aria-label={`View comparison for ${row.name}`}
                    className="inline-flex min-h-9 items-center justify-center rounded-lg border border-blue-600 px-3 text-xs font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-blue-500 dark:text-blue-300 dark:hover:bg-blue-950/60"
                    onClick={() => onSelectRow(index)}
                    type="button"
                  >
                    View comparison
                  </button>
                ) : (
                  <span className="text-xs text-zinc-400">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
