import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { afterEach, describe, expect, it } from 'vitest';

const SCRIPT = join(__dirname, '../../scripts/check-bundle.mjs');
const dirs: string[] = [];

function build(scripts: { name: string; body: Buffer; noModule?: boolean }[]) {
  const root = mkdtempSync(join(tmpdir(), 'check-bundle-'));
  dirs.push(root);
  mkdirSync(join(root, '.next/server/app'), { recursive: true });
  mkdirSync(join(root, '.next/static/chunks'), { recursive: true });
  const tags = scripts.map((s) => {
    writeFileSync(join(root, '.next/static/chunks', s.name), s.body);
    return `<script src="/_next/static/chunks/${s.name}"${s.noModule ? ' noModule=""' : ' async=""'}></script>`;
  });
  writeFileSync(join(root, '.next/server/app/index.html'), `<html><head>${tags.join('')}${tags[0] ?? ''}</head><body></body></html>`);
  return root;
}

const run = (root: string) => spawnSync(process.execPath, [SCRIPT, root], { encoding: 'utf8' });

afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe('check-bundle', () => {
  it('passes under 150 KiB and prints the gzip total of the module scripts, not the noModule polyfill', () => {
    const a = Buffer.from('console.log("a");'.repeat(2000));
    const b = randomBytes(40 * 1024);
    const root = build([
      { name: 'a.js', body: a },
      { name: 'b.js', body: b },
      { name: 'polyfill.js', body: randomBytes(200 * 1024), noModule: true },
    ]);
    const r = run(root);
    const total = gzipSync(a).length + gzipSync(b).length;
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toContain(`first-load JS gzip: ${total.toLocaleString('en-US')} B`);
    expect(r.stdout).toContain('PASS');
  });

  it('fails above 150 KiB and says by how much', () => {
    const body = randomBytes(160 * 1024);
    const r = run(build([{ name: 'big.js', body }]));
    expect(r.status).toBe(1);
    expect(r.stdout).toContain(`first-load JS gzip: ${gzipSync(body).length.toLocaleString('en-US')} B`);
    expect(r.stdout).toContain('FAIL, over by');
  });

  it('asks for a build when there is none', () => {
    const root = mkdtempSync(join(tmpdir(), 'check-bundle-'));
    dirs.push(root);
    const r = run(root);
    expect(r.status).toBe(2);
    expect(r.stderr).toContain('next build');
  });
});
