/**
 * Central thresholds for fuzzy field matching (brand, class/type).
 * Adjust here and update tests when tuning OCR tolerance.
 */
export const FUZZY_TOKEN_MIN_LENGTH = 3;

/** Token overlap at or above this ratio yields `match` when substring match fails. */
export const FUZZY_OVERLAP_MATCH_THRESHOLD = 0.75;

/** Token overlap at or above this ratio (but below match threshold) yields `uncertain`. */
export const FUZZY_OVERLAP_UNCERTAIN_THRESHOLD = 0.45;
