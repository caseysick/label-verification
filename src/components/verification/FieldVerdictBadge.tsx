import type { FieldVerdict } from "@/lib/domain/types";

import { fieldVerdictBadgeClasses } from "@/styles/field-verdict-badge";

export function FieldVerdictBadge({ verdict }: { verdict: FieldVerdict }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset ${fieldVerdictBadgeClasses(verdict)}`}
    >
      {verdict}
    </span>
  );
}
