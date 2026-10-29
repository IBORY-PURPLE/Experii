import {
  test,
  expect,
  _electron as electron,
  type ElectronApplication,
} from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { API_KEYS } from '../../src/shared/api';

let app: ElectronApplication;
let userData: string;

test.beforeAll(async () => {
  userData = mkdtempSync(path.join(tmpdir(), 'experii-e2e-'));
  app = await electron.launch({
    args: ['.'],
    env: { ...process.env, EXPERII_USER_DATA: userData },
  });
});

test.afterAll(async () => {
  await app?.close();
  rmSync(userData, { recursive: true, force: true });
});

test('the renderer is isolated and only sees the allowed bridge', async () => {
  const win = await app.firstWindow();
  await expect(win).toHaveTitle('Experii');
  expect(
    await win.evaluate(
      () => typeof (globalThis as { require?: unknown }).require,
    ),
  ).toBe('undefined');
  expect(
    await win.evaluate(
      () => typeof (globalThis as { process?: unknown }).process,
    ),
  ).toBe('undefined');
  expect(await win.evaluate(() => Object.keys(window.experii).sort())).toEqual(
    [...API_KEYS].sort(),
  );
  expect(await win.evaluate(() => location.protocol)).toBe('app:');

  const before = await win.evaluate(() => location.href);
  expect(
    await win.evaluate(() => window.open('https://example.com')),
  ).toBeNull();
  await win.evaluate(() => {
    location.href = 'https://example.com';
  });
  await win.waitForTimeout(500);
  expect(await win.evaluate(() => location.href)).toBe(before);
  expect(app.windows()).toHaveLength(1);
});

test('IPC round-trips through the database', async () => {
  const win = await app.firstWindow();
  const created = await win.evaluate(() =>
    window.experii.createSubject('SQLD'),
  );
  expect(created).toMatchObject({
    ok: true,
    data: { title: 'SQLD', cardCount: 0 },
  });
  const dup = await win.evaluate(() => window.experii.createSubject('sqld'));
  expect(dup).toMatchObject({ ok: false, code: 'duplicate' });
  const bad = await win.evaluate(() => window.experii.getRoadmap('nope'));
  expect(bad).toMatchObject({ ok: false, code: 'invalid_payload' });
  await win.screenshot({ path: 'test-results/m1-window.png' });
});
