export type OcrSuccess = {
  ok: true;
  text: string;
  engine: "tesseract" | "manual";
};

export type OcrFailure = {
  ok: false;
  reason: "timeout" | "failed" | "unsupported";
  detail?: string;
};

export type OcrResult = OcrSuccess | OcrFailure;
