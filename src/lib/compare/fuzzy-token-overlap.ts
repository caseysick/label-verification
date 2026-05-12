import { normalizeFuzzy } from "./normalize";
import { FUZZY_TOKEN_MIN_LENGTH } from "./thresholds";

/**
 * Share of significant tokens from the application value found inside label/OCR text.
 */
export function computeFuzzyTokenOverlapRatio(
  applicationValue: string,
  labelText: string,
): number {
  const tokens = normalizeFuzzy(applicationValue)
    .split(/\s+/u)
    .filter((t) => t.length >= FUZZY_TOKEN_MIN_LENGTH);
  if (tokens.length === 0) return 0;
  const hay = normalizeFuzzy(labelText);
  const hits = tokens.filter((t) => hay.includes(t)).length;
  return hits / tokens.length;
}
