import { NextResponse } from "next/server";

import { compareOnlyRequestSchema } from "@/lib/api/schemas";
import { compareFields } from "@/lib/compare/compare-fields";

export const runtime = "nodejs";

/**
 * OCR-free comparison: supply application fields + raw label text (e.g. client-side OCR or paste).
 */
export async function POST(request: Request) {
  let bodyJson: unknown;
  try {
    bodyJson = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsed = compareOnlyRequestSchema.safeParse(bodyJson);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { application, extractedLabelText } = parsed.data;
  const fields = compareFields({
    application,
    labelText: extractedLabelText,
  });

  return NextResponse.json({
    fields,
    ocr: {
      engine: "manual",
      note: "Compare-only: server did not run OCR.",
      extractedTextPreview: extractedLabelText.replace(/\s+/gu, " ").trim().slice(0, 600),
    },
  });
}
