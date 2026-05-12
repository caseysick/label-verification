import { normalizeStrict } from "./normalize";

/** Require literal banner substring per stakeholder guidance (caps matter). */
export const GOVERNMENT_WARNING_BANNER = "GOVERNMENT WARNING:";

export interface GovernmentWarningEvaluation {
  verdict: "match" | "mismatch" | "uncertain";
  detail?: string;
}

/**
 * Compares application-provided warning text to label evidence.
 * Policy: banner must appear verbatim on the label; body compared after whitespace normalize.
 */
export function evaluateGovernmentWarning(
  applicationWarning: string,
  labelText: string,
): GovernmentWarningEvaluation {
  const appNorm = normalizeStrict(applicationWarning);
  const labelNorm = normalizeStrict(labelText);

  if (!appNorm) {
    return { verdict: "uncertain", detail: "Application warning missing." };
  }

  if (!labelNorm) {
    return { verdict: "uncertain", detail: "No readable label text." };
  }

  const bannerIndex = labelText.indexOf(GOVERNMENT_WARNING_BANNER);
  if (bannerIndex === -1) {
    return {
      verdict: "mismatch",
      detail: `Label text must include "${GOVERNMENT_WARNING_BANNER}" exactly.`,
    };
  }

  const labelWarningBody = normalizeStrict(labelText.slice(bannerIndex));
  const appBodyNorm = normalizeStrict(appNorm);

  if (labelWarningBody === appBodyNorm) {
    return { verdict: "match" };
  }

  const collapsedLabel = labelWarningBody.replace(/[^\p{L}\p{N}\s]/gu, "").toUpperCase();
  const collapsedApp = appBodyNorm.replace(/[^\p{L}\p{N}\s]/gu, "").toUpperCase();

  if (collapsedLabel === collapsedApp) {
    return {
      verdict: "match",
      detail:
        "Match after punctuation-insensitive comparison (confirm OCR quality before relying on this).",
    };
  }

  const inclusionPass =
    collapsedApp.length > 40 &&
    collapsedLabel.includes(collapsedApp.slice(0, Math.min(collapsedApp.length, 80)));

  if (inclusionPass) {
    return {
      verdict: "uncertain",
      detail: "Partial overlap detected; human review recommended.",
    };
  }

  return {
    verdict: "mismatch",
    detail: "Government warning text does not match application text.",
  };
}
