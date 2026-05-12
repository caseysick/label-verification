export type FieldKey =
  | "brandName"
  | "classType"
  | "alcoholContent"
  | "netContents"
  | "producerAddress"
  | "countryOfOrigin"
  | "governmentWarning";

export type FieldVerdict = "match" | "mismatch" | "uncertain" | "missing";

/** Values expected from the application record (COLA-style conceptual model). */
export interface ApplicationPayload {
  brandName: string;
  classType: string;
  alcoholContent: string;
  netContents: string;
  producerAddress: string;
  countryOfOrigin: string;
  governmentWarning: string;
}

export interface FieldComparisonResult {
  field: FieldKey;
  verdict: FieldVerdict;
  applicationDisplay: string;
  detectedSnippet?: string;
  detail?: string;
}

export type OcrEngineTag = "tesseract" | "manual" | "none";

export interface VerificationReport {
  fields: FieldComparisonResult[];
  ocr: {
    engine: OcrEngineTag;
    note?: string;
    extractedTextPreview?: string;
  };
}
