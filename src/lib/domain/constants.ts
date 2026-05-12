/** Canonical TTB-style spirits warning (prototype baseline). Applications should align to published CFR wording for production. */
export const CANONICAL_GOVERNMENT_WARNING =
  "GOVERNMENT WARNING: (1) ACCORDING TO THE SURGEON GENERAL, WOMEN SHOULD NOT DRINK ALCOHOLIC BEVERAGES DURING PREGNANCY BECAUSE OF THE RISK OF BIRTH DEFECTS. (2) CONSUMPTION OF ALCOHOLIC BEVERAGES IMPAIRS YOUR ABILITY TO DRIVE A CAR OR OPERATE MACHINERY, AND MAY CAUSE HEALTH PROBLEMS.";

/** Soft ceiling for JSON/base64 uploads via Route Handlers (adjust per host limits). */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/** Default OCR budget (may exceed ideal UX if cold-start heavy; surface timeout as uncertain). */
export const DEFAULT_OCR_TIMEOUT_MS = 12_000;

/** Allowed image MIME types for OCR path. */
export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];
