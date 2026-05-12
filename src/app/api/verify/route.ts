import { NextResponse } from "next/server";

import {
  decodeBase64Image,
  verifyRequestSchema,
} from "@/lib/api/schemas";
import { runVerification } from "@/lib/services/verification-service";
import {
  VerificationPayloadError,
  VerificationUnsupportedMedia,
} from "@/lib/services/errors";

export const runtime = "nodejs";

/** Allow bundled OCR cold-start on hobby tiers where supported. */
export const maxDuration = 60;

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

  const parsed = verifyRequestSchema.safeParse(bodyJson);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid payload.",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  const body = parsed.data;

  let image: { buffer: Buffer; mimeType: string } | undefined;
  if (body.extractionMode === "ocr") {
    const decoded = decodeBase64Image(body.imageBase64 ?? "");
    if ("error" in decoded) {
      return NextResponse.json({ error: decoded.error }, { status: 400 });
    }
    image = {
      buffer: decoded.buffer,
      mimeType: body.imageMimeType as string,
    };
  }

  try {
    const report = await runVerification({
      application: body.application,
      mode: body.extractionMode,
      extractedLabelText: body.extractedLabelText,
      image,
      ocrTimeoutMs: body.ocrTimeoutMs,
    });

    return NextResponse.json(report);
  } catch (error) {
    if (error instanceof VerificationUnsupportedMedia) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof VerificationPayloadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("[verify]", error);
    return NextResponse.json(
      { error: "Verification failed unexpectedly." },
      { status: 500 },
    );
  }
}
