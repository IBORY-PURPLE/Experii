import path from 'node:path';

export const APP_HOST = 'main';
export const APP_ORIGIN = `app://${APP_HOST}`;

export const CSP_PROD = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ');

export function cspDev(devServer: string): string {
  const ws = devServer.replace(/^http/, 'ws');
  return [
    "default-src 'none'",
    `script-src 'self' 'unsafe-inline' ${devServer}`,
    `style-src 'self' 'unsafe-inline' ${devServer}`,
    `img-src 'self' data: ${devServer}`,
    `font-src 'self' ${devServer}`,
    `connect-src 'self' ${devServer} ${ws}`,
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ].join('; ');
}

// Maps app://main/<path> onto the renderer build folder; anything that would leave it is refused.
export function resolveAssetPath(root: string, rawUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (url.protocol !== 'app:' || url.host !== APP_HOST) return null;
  let rel: string;
  try {
    rel = decodeURIComponent(url.pathname);
  } catch {
    return null;
  }
  if (rel.includes('\0') || rel.split(/[\\/]/).includes('..')) return null;
  rel = rel.replace(/^[\\/]+/, '') || 'index.html';
  if (path.isAbsolute(rel) || /^[a-zA-Z]:/.test(rel)) return null;
  const base = path.resolve(root);
  const full = path.resolve(base, rel);
  if (full !== base && !full.startsWith(base + path.sep)) return null;
  return full;
}

export const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.json': 'application/json',
};
