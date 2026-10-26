// First-load JS budget (TSD 12: "첫 로드 JS (gzip) 150KB 이하"), checked against the last `next build`.
// Sums the gzip size of every <script src> the home page loads, skipping the noModule polyfill that
// modern browsers never fetch. TSD does not define KB; this reads it as KiB (1024 B) and prints both units.
// Usage: node scripts/check-bundle.mjs [projectRoot]
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { brotliCompressSync, gzipSync } from 'node:zlib';

const BUDGET = 150 * 1024;

const root = resolve(process.argv[2] ?? '.');
const page = join(root, '.next/server/app/index.html');
if (!existsSync(page)) {
  console.error(`check-bundle: ${page} not found. Run \`next build\` first.`);
  process.exit(2);
}

const srcs = new Set();
for (const [tag] of readFileSync(page, 'utf8').matchAll(/<script\b[^>]*>/gi)) {
  const src = /\ssrc="([^"]+)"/i.exec(tag)?.[1];
  if (src && !/\snomodule\b/i.test(tag)) srcs.add(src);
}

const rows = [...srcs].map((src) => {
  const file = join(root, '.next', decodeURIComponent(new URL(src, 'http://localhost').pathname).replace(/^\/_next\//, ''));
  const body = readFileSync(file);
  return { src, gzip: gzipSync(body).length, brotli: brotliCompressSync(body).length };
});

const sum = (key) => rows.reduce((n, r) => n + r[key], 0);
const gzip = sum('gzip');
const fmt = (b) => `${b.toLocaleString('en-US')} B (${(b / 1024).toFixed(1)} KiB, ${(b / 1000).toFixed(1)} kB)`;

for (const r of rows.sort((a, b) => b.gzip - a.gzip)) console.log(`${String(r.gzip).padStart(8)}  ${r.src}`);
console.log(`scripts: ${rows.length}`);
console.log(`first-load JS gzip: ${fmt(gzip)}`);
console.log(`first-load JS brotli (info): ${fmt(sum('brotli'))}`);
console.log(`budget: ${fmt(BUDGET)} -> ${gzip <= BUDGET ? 'PASS' : `FAIL, over by ${fmt(gzip - BUDGET)}`}`);
process.exit(gzip <= BUDGET ? 0 : 1);
