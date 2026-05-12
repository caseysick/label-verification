import {
  FIELD_KEYS,
  FIELD_LABELS,
} from "@/lib/domain/field-metadata";
import type { ApplicationPayload } from "@/lib/domain/types";

type Props = {
  application: ApplicationPayload;
  onFieldChange: (key: keyof ApplicationPayload, value: string) => void;
  onResetDemo: () => void;
};

export function ApplicationValuesSection({
  application,
  onFieldChange,
  onResetDemo,
}: Props) {
  return (
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
          onClick={onResetDemo}
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
                onChange={(event) => onFieldChange(key, event.target.value)}
                value={application[key]}
              />
            ) : (
              <input
                className="min-h-11 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-inner focus-visible:border-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                id={`field-${key}`}
                onChange={(event) => onFieldChange(key, event.target.value)}
                type="text"
                value={application[key]}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
