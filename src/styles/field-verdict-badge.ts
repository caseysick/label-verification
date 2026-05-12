import type { FieldVerdict } from "@/lib/domain/types";

/** Tailwind class strings for field verdict pills (comparison results). */
export function fieldVerdictBadgeClasses(verdict: FieldVerdict): string {
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
