export class VerificationPayloadError extends Error {
  readonly status = 400;

  constructor(message: string) {
    super(message);
    this.name = "VerificationPayloadError";
  }
}

export class VerificationUnsupportedMedia extends VerificationPayloadError {
  constructor(message = "Unsupported image content type.") {
    super(message);
    this.name = "VerificationUnsupportedMedia";
  }
}
