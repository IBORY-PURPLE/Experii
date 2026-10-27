// Runs the landing gates in order and writes landing/test-results/gates.json.
// Local sessions, cloud sessions and CI all run this one script, so "pass" means the same thing everywhere.
// Usage: node scripts/agents/gates.mjs [--skip-e2e]
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const landing = resolve(dirname(fileURLToPath(import.meta.url)), '../../landing');
const out = join(landing, 'test-results');
const e2eJson = join(out, 'e2e.json');
const skipE2e = process.argv.includes('--skip-e2e');

const steps = [
  { name: 'typecheck', cmd: 'npm run typecheck' },
  { name: 'unit', cmd: 'npm test' },
  { name: 'build', cmd: 'npm run build' },
  { name: 'bundle', cmd: 'npm run check:bundle', needsBuild: true },
  { name: 'e2e', cmd: 'npm run test:e2e:prod -- --reporter=list,json', needsBuild: true, skip: skipE2e },
];

mkdirSync(out, { recursive: true });
rmSync(e2eJson, { force: true });

const results = [];
let built = true;
for (const step of steps) {
  if (step.skip || (step.needsBuild && !built)) {
    results.push({ name: step.name, status: step.skip ? 'skipped' : 'blocked' });
    continue;
  }
  const started = Date.now();
  const run = spawnSync(step.cmd, {
    cwd: landing,
    shell: true,
    stdio: 'inherit',
    env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_FILE: e2eJson },
  });
  const result = {
    name: step.name,
    status: run.status === 0 ? 'pass' : 'fail',
    exitCode: run.status,
    seconds: Math.round((Date.now() - started) / 1000),
  };
  if (step.name === 'e2e' && existsSync(e2eJson)) {
    const { stats } = JSON.parse(readFileSync(e2eJson, 'utf8'));
    result.tests = { passed: stats.expected, failed: stats.unexpected, flaky: stats.flaky, skipped: stats.skipped };
  }
  if (step.name === 'build' && result.status === 'fail') built = false;
  results.push(result);
}

const ok = results.every((r) => r.status === 'pass' || r.status === 'skipped');
const sha = spawnSync('git rev-parse HEAD', { cwd: landing, shell: true, encoding: 'utf8' }).stdout.trim();
const report = { ok, sha, platform: process.platform, node: process.version, at: new Date().toISOString(), steps: results };
writeFileSync(join(out, 'gates.json'), `${JSON.stringify(report, null, 2)}\n`);

for (const r of results) {
  const tests = r.tests ? ` (${r.tests.passed} passed, ${r.tests.failed} failed, ${r.tests.skipped} skipped)` : '';
  console.log(`gate ${r.name.padEnd(9)} ${r.status}${tests}`);
}
console.log(`gates: ${ok ? 'PASS' : 'FAIL'} -> ${join(out, 'gates.json')}`);
process.exit(ok ? 0 : 1);
