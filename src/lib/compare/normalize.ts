/** Collapses Unicode whitespace for tolerant comparisons. */
export function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/gu, " ").trim();
}

/** Lowercases and strips light punctuation for fuzzy fields (e.g., brand). */
export function normalizeFuzzy(input: string): string {
  const base = normalizeWhitespace(input).toLowerCase();
  return base.replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/gu, " ").trim();
}

/** Strict side-by-side normalization (preserves case). */
export function normalizeStrict(input: string): string {
  return normalizeWhitespace(input);
}
