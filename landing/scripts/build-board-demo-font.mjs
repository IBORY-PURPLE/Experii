// Writes components/hero/board-demo/fonts/bd-pretendard.woff2: Pretendard Variable cut down to the characters the hero window shows.
// The window's text is set in the app's own font so lines break where the app breaks them; the page's own font stays as it is.
// Needs Python with fonttools and brotli (pip install fonttools brotli); the 2MB source is the pretendard npm package, not committed.
// Run again after the window's text changes. Usage: node scripts/build-board-demo-font.mjs [--check]
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeEol } from './lib/same-text.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const SRC_DIR = join(root, 'components/hero/board-demo');
const FONT_DIR = join(SRC_DIR, 'fonts');
const SOURCE_FONT = join(root, 'node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2');
const SOURCE_LICENSE = join(root, 'node_modules/pretendard/dist/LICENSE.txt');
const OUT = join(FONT_DIR, 'bd-pretendard.woff2');
const LICENSE = join(FONT_DIR, 'LICENSE-Pretendard.txt');
const CHARS = join(FONT_DIR, 'bd-pretendard.chars.txt');

// Every character that appears in the window's source files, plus printable ASCII (the chat and the table take typed and numeric text).
function sources(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return name === 'fonts' ? [] : sources(p);
    return /\.(tsx?|json)$/.test(name) ? [p] : [];
  });
}

// What the cursors say in the window is copy, so it lives in content/loop.ts (heroBoard.talk); only that block is read.
function talkText() {
  const loop = readFileSync(join(root, 'content/loop.ts'), 'utf8');
  const from = loop.indexOf('talk: {');
  return from < 0 ? '' : loop.slice(from, loop.indexOf('}', from));
}

function wanted() {
  const set = new Set();
  for (let c = 0x20; c < 0x7f; c += 1) set.add(String.fromCodePoint(c));
  const texts = [...sources(SRC_DIR).map((file) => readFileSync(file, 'utf8')), talkText()];
  for (const text of texts) {
    for (const ch of text) if (ch.codePointAt(0) > 0x7e) set.add(ch);
  }
  return [...set].sort((a, b) => a.codePointAt(0) - b.codePointAt(0)).join('');
}

const chars = wanted();
if (process.argv.includes('--check')) {
  let have = '';
  try {
    have = readFileSync(CHARS, 'utf8').replace(/\r?\n$/, '');
  } catch {
    // missing counts as stale
  }
  if (have !== chars) {
    console.error('bd-pretendard.woff2 does not cover the window text: run `node scripts/build-board-demo-font.mjs`');
    process.exit(1);
  }
  console.log(`bd-pretendard.woff2 covers the window text (${[...chars].length} characters)`);
} else {
  mkdirSync(FONT_DIR, { recursive: true });
  const unicodes = [...chars].map((c) => c.codePointAt(0).toString(16)).join(',');
  const python = process.env.PYTHON || 'python';
  // -P keeps the working directory off sys.path (a stray json.py cannot be imported) and, unlike -I, still sees pip's user packages.
  const version = spawnSync(python, ['-c', 'import sys; print(sys.version_info >= (3, 11))'], { encoding: 'utf8' });
  if (version.status !== 0 || version.stdout.trim() !== 'True') {
    console.error('Python 3.11 or newer is needed (python -P); set PYTHON to one, and pip install fonttools brotli');
    process.exit(1);
  }
  const run = spawnSync(
    python,
    ['-P', '-m', 'fontTools.subset', SOURCE_FONT, `--unicodes=${unicodes}`, '--flavor=woff2', '--layout-features=*', '--no-hinting', `--output-file=${OUT}`],
    { stdio: 'inherit' },
  );
  if (run.status !== 0) {
    console.error('fonttools failed (pip install fonttools brotli)');
    process.exit(run.status ?? 1);
  }
  copyFileSync(SOURCE_LICENSE, LICENSE);
  writeFileSync(CHARS, `${chars}\n`);
  console.log(`wrote ${OUT.replace(root, '').replaceAll('\\', '/')} (${statSync(OUT).size} bytes, ${[...chars].length} characters)`);
}
