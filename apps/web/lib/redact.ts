// The same secret shapes the desktop app masks in cards (apps/desktop/src/main/redact.ts), applied to notes made
// from a capture as a safety net behind the model's own redaction.
export const REDACTED = '[redacted]';

const PATTERNS: RegExp[] = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z ]*PRIVATE KEY-----|$)/g,
  /\bBearer\s+[A-Za-z0-9._~+/=-]{16,}/g,
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g,
  /\bsk-[A-Za-z0-9_-]{20,}/g,
  /\bgh[pousr]_[A-Za-z0-9]{36,}/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\bAIza[0-9A-Za-z_-]{35}/g,
  /\bxox[abprs]-[A-Za-z0-9-]{10,}/g,
  /\b\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])-[1-4]\d{6}\b/g,
  /(?:password|passwd|비밀번호)\s*[:=]\s*\S+/gi,
];

export function redactText(input: string): { text: string; count: number } {
  let count = 0;
  let text = input;
  for (const pattern of PATTERNS) {
    text = text.replace(pattern, () => {
      count += 1;
      return REDACTED;
    });
  }
  return { text, count };
}
