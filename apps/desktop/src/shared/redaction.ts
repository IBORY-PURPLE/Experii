// The mask the main process writes over secrets in a card. It lives apart from shared/card.ts so the renderer can
// mark masks in card text without pulling zod into its bundle.
export const REDACTED = '***REDACTED***';
