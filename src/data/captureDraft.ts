export const MAX_CAPTURE_CHARACTERS = 10_000;

export type CaptureDraftReceipt = Readonly<{
  requestId: string;
  createdAt: string;
  characterCount: number;
  lineCount: number;
  summary: "FIELD_NOTE_CAPTURED";
  proofState: "LOCAL_DRAFT_NOT_DISPATCHED";
}>;

export type CaptureDraftResult =
  | Readonly<{ ok: true; receipt: CaptureDraftReceipt }>
  | Readonly<{
      ok: false;
      code: "BLANK" | "TOO_LONG" | "SECRET_FIELD" | "EMBEDDED_CREDENTIAL";
      message: string;
    }>;

const secretFieldPattern =
  /(?:api[\s_-]*key|authorization|cookie|oauth|passphrase|password|private[\s_-]*key|secret|token)\s*[:=]\s*\S+/i;

const embeddedCredentialPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/i,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /https?:\/\/[^\s/:]+:[^\s/@]+@/i,
];

export function createCaptureDraftReceipt(input: string, now: Date): CaptureDraftResult {
  const trimmed = input.trim();
  if (trimmed === "") {
    return Object.freeze({ ok: false, code: "BLANK", message: "Enter a note before creating a receipt." });
  }
  if (input.length > MAX_CAPTURE_CHARACTERS) {
    return Object.freeze({
      ok: false,
      code: "TOO_LONG",
      message: "Note cannot exceed 10,000 characters.",
    });
  }
  if (secretFieldPattern.test(input)) {
    return Object.freeze({
      ok: false,
      code: "SECRET_FIELD",
      message: "Remove credential-shaped fields before continuing.",
    });
  }
  if (embeddedCredentialPatterns.some((pattern) => pattern.test(input))) {
    return Object.freeze({
      ok: false,
      code: "EMBEDDED_CREDENTIAL",
      message: "Remove embedded credentials before continuing.",
    });
  }

  const timestamp = now.getTime();
  if (!Number.isFinite(timestamp)) {
    throw new Error("Capture time is invalid.");
  }

  return Object.freeze({
    ok: true,
    receipt: Object.freeze({
      requestId: `capture-local-${timestamp.toString(36)}`,
      createdAt: now.toISOString(),
      characterCount: input.length,
      lineCount: input.split(/\r?\n/).length,
      summary: "FIELD_NOTE_CAPTURED",
      proofState: "LOCAL_DRAFT_NOT_DISPATCHED",
    }),
  });
}
