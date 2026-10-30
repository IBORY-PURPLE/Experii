import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = path.resolve(__dirname, '../../src');

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory()
      ? files(full)
      : /\.(ts|tsx)$/.test(name)
        ? [full]
        : [];
  });
}

// Guards the Electron 46 upgrade (sync safeStorage goes away) and the security baseline.
const RULES: Array<[RegExp, string]> = [
  [/\bencryptString\(/, 'sync safeStorage.encryptString'],
  [/\bdecryptString\(/, 'sync safeStorage.decryptString'],
  [/nodeIntegration:\s*true/, 'nodeIntegration: true'],
  [/contextIsolation:\s*false/, 'contextIsolation: false'],
  [/sandbox:\s*false/, 'sandbox: false'],
  [/webSecurity:\s*false/, 'webSecurity: false'],
  [/dangerouslySetInnerHTML/, 'dangerouslySetInnerHTML'],
];

describe('forbidden patterns', () => {
  const all = files(SRC);

  it('finds source files', () => {
    expect(all.length).toBeGreaterThan(5);
  });

  for (const [pattern, label] of RULES) {
    it(`src/ has no ${label}`, () => {
      const offenders = all.filter((f) =>
        pattern.test(readFileSync(f, 'utf8')),
      );
      expect(offenders.map((f) => path.relative(SRC, f))).toEqual([]);
    });
  }

  it('preload never uses ipcRenderer.send', () => {
    expect(readFileSync(path.join(SRC, 'preload.ts'), 'utf8')).not.toMatch(
      /ipcRenderer\.send\b/,
    );
  });
});
