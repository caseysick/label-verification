import type { FieldKey } from "@/lib/domain/types";

export const FIELD_KEYS: FieldKey[] = [
  "brandName",
  "classType",
  "alcoholContent",
  "netContents",
  "producerAddress",
  "countryOfOrigin",
  "governmentWarning",
];

export const FIELD_LABELS: Record<FieldKey, string> = {
  brandName: "Brand name",
  classType: "Class / type",
  alcoholContent: "Alcohol content",
  netContents: "Net contents",
  producerAddress: "Producer / bottler address",
  countryOfOrigin: "Country of origin",
  governmentWarning: "Government warning",
};
