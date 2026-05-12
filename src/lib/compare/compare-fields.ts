import { CANONICAL_GOVERNMENT_WARNING } from "@/lib/domain/constants";
import type {
  ApplicationPayload,
  FieldComparisonResult,
  FieldKey,
  FieldVerdict,
} from "@/lib/domain/types";
import { computeFuzzyTokenOverlapRatio } from "./fuzzy-token-overlap";
import {
  evaluateGovernmentWarning,
  GOVERNMENT_WARNING_BANNER,
} from "./government-warning";
import { normalizeFuzzy, normalizeStrict } from "./normalize";
import {
  FUZZY_OVERLAP_MATCH_THRESHOLD,
  FUZZY_OVERLAP_UNCERTAIN_THRESHOLD,
} from "./thresholds";

export interface CompareFieldsInput {
  application: ApplicationPayload;
  labelText: string;
}

function compressSnippet(text: string): string {
  return normalizeStrict(text);
}

function shortSnippet(haystack: string, needle: string, radius = 48): string | undefined {
  const idx = haystack.toLowerCase().indexOf(needle.toLowerCase());
  if (idx === -1) return undefined;
  const start = Math.max(0, idx - radius);
  const end = Math.min(haystack.length, idx + needle.length + radius);
  const slice = compressSnippet(haystack.slice(start, end));
  return slice.length > 160 ? `${slice.slice(0, 157)}…` : slice;
}

/** When OCR scrambles layout, show the start of the transcript so reviewers still see evidence. */
function fallbackLabelSnippet(labelText: string): string | undefined {
  const fb = compressSnippet(labelText);
  if (!fb) return undefined;
  return fb.length > 180 ? `${fb.slice(0, 177)}…` : fb;
}

function evidenceSnippet(
  labelText: string,
  needle: string,
): string | undefined {
  return shortSnippet(labelText, needle) ?? fallbackLabelSnippet(labelText);
}

function classifySimple(params: {
  applicationValue: string;
  labelText: string;
  mode: "strict" | "fuzzy";
}): { verdict: FieldVerdict; snippet?: string; detail?: string } {
  const { applicationValue, labelText, mode } = params;
  const trimmedApp = applicationValue.trim();

  if (!trimmedApp) {
    return { verdict: "missing", detail: "Application field empty." };
  }

  const normalizedApp =
    mode === "fuzzy" ? normalizeFuzzy(trimmedApp) : normalizeStrict(trimmedApp);
  const normalizedLabel =
    mode === "fuzzy" ? normalizeFuzzy(labelText) : normalizeStrict(labelText);

  if (!normalizedLabel) {
    return { verdict: "uncertain", detail: "Could not read comparable label text." };
  }

  if (normalizedLabel.includes(normalizedApp)) {
    return {
      verdict: "match",
      snippet: evidenceSnippet(labelText, trimmedApp),
    };
  }

  if (mode === "fuzzy") {
    const ratio = computeFuzzyTokenOverlapRatio(trimmedApp, labelText);
    const snippet = evidenceSnippet(labelText, trimmedApp);
    if (ratio >= FUZZY_OVERLAP_MATCH_THRESHOLD) {
      return {
        verdict: "match",
        snippet,
        detail:
          "Matched most distinctive tokens from OCR text (layout may differ from the application record).",
      };
    }
    if (ratio >= FUZZY_OVERLAP_UNCERTAIN_THRESHOLD) {
      return {
        verdict: "uncertain",
        snippet,
        detail:
          "Some tokens match OCR text but wording or layout looks incomplete; verify visually.",
      };
    }
    return {
      verdict: "mismatch",
      snippet,
      detail: "Normalized fuzzy comparison failed (tokens did not align with OCR output).",
    };
  }

  return {
    verdict: "mismatch",
    snippet: evidenceSnippet(labelText, trimmedApp),
    detail: "Strict normalized comparison failed.",
  };
}

const FIELD_ORDER: FieldKey[] = [
  "brandName",
  "classType",
  "alcoholContent",
  "netContents",
  "producerAddress",
  "countryOfOrigin",
  "governmentWarning",
];

export function compareFields(input: CompareFieldsInput): FieldComparisonResult[] {
  const { application, labelText } = input;

  return FIELD_ORDER.map<FieldComparisonResult>((field) => {
    const applicationDisplay = application[field];

    if (field === "governmentWarning") {
      const evaluation = evaluateGovernmentWarning(applicationDisplay, labelText);
      const bannerIdx = labelText.indexOf(GOVERNMENT_WARNING_BANNER);
      let detectedSnippet: string | undefined;
      if (bannerIdx !== -1) {
        const raw = compressSnippet(labelText.slice(bannerIdx, bannerIdx + 280));
        detectedSnippet = raw.length > 200 ? `${raw.slice(0, 197)}…` : raw;
      }

      return {
        field,
        verdict: evaluation.verdict,
        applicationDisplay,
        detectedSnippet,
        detail: evaluation.detail,
      };
    }

    const mode =
      field === "brandName" || field === "classType"
        ? ("fuzzy" as const)
        : ("strict" as const);

    const outcome = classifySimple({
      applicationValue: applicationDisplay,
      labelText,
      mode,
    });

    return {
      field,
      verdict: outcome.verdict,
      applicationDisplay,
      detectedSnippet: outcome.snippet,
      detail: outcome.detail,
    };
  });
}

/** Exported helper for UI defaults/tests */
export function buildDemoApplication(overrides: Partial<ApplicationPayload> = {}): ApplicationPayload {
  const base: ApplicationPayload = {
    brandName: "OLD TOM DISTILLERY",
    classType: "Kentucky Straight Bourbon Whiskey",
    alcoholContent: "45% Alc./Vol. (90 Proof)",
    netContents: "750 mL",
    producerAddress: "Old Tom Distillery, Louisville, KY 40202",
    countryOfOrigin: "United States",
    governmentWarning: CANONICAL_GOVERNMENT_WARNING,
  };
  return { ...base, ...overrides };
}
