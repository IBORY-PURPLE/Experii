// Read-only check before driving the landing app: is the port serving the build in landing/.next?
// Exit 0 when the server answers with the current BUILD_ID, 2 when nothing listens (Playwright will start
// `next start` itself), 1 when another build or the dev server holds the port. Never drive an instance you did not start.
// Usage: node scripts/agents/verify-doctor.mjs [baseUrl]
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const landing = resolve(dirname(fileURLToPath(import.meta.url)), '../../landing');
const base = process.argv[2] ?? 'http://localhost:3100/';
const idFile = join(landing, '.next', 'BUILD_ID');

if (!existsSync(idFile)) {
  console.log('doctor: no production build. Run `npm --prefix landing run build` first.');
  process.exit(1);
}
const buildId = readFileSync(idFile, 'utf8').trim();
const dirty = execSync('git status --porcelain -- .', { cwd: landing, encoding: 'utf8' }).trim();
console.log(`doctor: build ${buildId}, landing tree ${dirty ? 'has uncommitted changes' : 'clean'}`);

let html;
try {
  const res = await fetch(base, { signal: AbortSignal.timeout(5000) });
  html = res.ok ? await res.text() : '';
  if (!res.ok) console.log(`doctor: ${base} answered ${res.status}`);
} catch {
  console.log(`doctor: nothing answers at ${base}; Playwright's webServer will start next start.`);
  process.exit(2);
}

if (html.includes(`"b":"${buildId}"`)) {
  console.log(`doctor: ${base} serves build ${buildId}. Ready.`);
  process.exit(0);
}
console.log(`doctor: ${base} is not serving build ${buildId} (another build or the dev server). Do not drive it.`);
process.exit(1);
