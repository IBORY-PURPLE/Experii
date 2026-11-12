// Shared by proxy.ts and the server: who may use the app, and the two cookies that say so.
export const INVITE_COOKIE = 'exp_inv';
export const VISITOR_COOKIE = 'exp_vid';
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 180;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const isVisitorId = (value: string | undefined | null): value is string =>
  !!value && UUID.test(value);

export function inviteCodes(): string[] {
  return (process.env.INVITE_CODES ?? '')
    .split(',')
    .map((code) => code.trim())
    .filter((code) => code.length >= 4);
}

// No codes configured means nobody gets in: an unset variable must not open the app to everyone.
export function isValidInvite(code: string | undefined | null): boolean {
  if (!code) return false;
  return inviteCodes().includes(code.trim());
}
