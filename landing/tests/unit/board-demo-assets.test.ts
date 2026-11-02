import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { normalizeEol, sameText } from '../../scripts/lib/same-text.mjs';

const ROOT = resolve(__dirname, '../..');
const check = (script: string) => spawnSync(process.execPath, [`scripts/${script}`, '--check'], { cwd: ROOT, encoding: 'utf8' });

describe('hero window assets', () => {
  it('a checkout with CRLF line ends is the same generated file', () => {
    expect(sameText('a {\n  b: c;\n}\n', 'a {\r\n  b: c;\r\n}\r\n')).toBe(true);
    expect(sameText('a\n', 'b\r\n')).toBe(false);
    expect(normalizeEol('x\r\ny\r\n')).toBe('x\ny\n');
  });

  it("the scoped app stylesheet is the generator output for the app's current styles", () => {
    const r = check('build-board-demo-css.mjs');
    expect(r.stderr).toBe('');
    expect(r.status).toBe(0);
  });

  it("the window's font subset covers every character the window's source shows", () => {
    const r = check('build-board-demo-font.mjs');
    expect(r.stderr).toBe('');
    expect(r.status).toBe(0);
  });
});
