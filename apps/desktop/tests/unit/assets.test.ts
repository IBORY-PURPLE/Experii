import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { allowNavigation, resolveAssetPath } from '../../src/main/assets';

const root = path.resolve('/srv/renderer/main_window');

describe('resolveAssetPath', () => {
  it('maps app://main paths inside the root', () => {
    expect(resolveAssetPath(root, 'app://main/index.html')).toBe(
      path.join(root, 'index.html'),
    );
    expect(resolveAssetPath(root, 'app://main/')).toBe(
      path.join(root, 'index.html'),
    );
    expect(resolveAssetPath(root, 'app://main/assets/a%20b.js')).toBe(
      path.join(root, 'assets', 'a b.js'),
    );
  });

  it('refuses traversal, absolute paths, other hosts and schemes', () => {
    // The URL parser already folds literal ../ segments, so they cannot climb above the root.
    expect(resolveAssetPath(root, 'app://main/../secret.txt')).toBe(
      path.join(root, 'secret.txt'),
    );
    expect(
      resolveAssetPath(root, 'app://main/assets/%2e%2e/%2e%2e/secret.txt'),
    ).toBe(path.join(root, 'secret.txt'));
    for (const url of [
      'app://main/..%5C..%5Csecret.txt',
      'app://main/C:/Windows/win.ini',
      'app://other/index.html',
      'file:///etc/passwd',
      'app://main/%00.js',
      'app://main/%E0%A4%A',
    ]) {
      expect(resolveAssetPath(root, url), url).toBeNull();
    }
  });
});

describe('allowNavigation', () => {
  it('blocks every navigation in a production build', () => {
    expect(allowNavigation('app://main/index.html')).toBe(false);
    expect(allowNavigation('https://example.com')).toBe(false);
  });

  it('lets only the dev server origin reload in development', () => {
    const dev = 'http://localhost:5173';
    expect(allowNavigation('http://localhost:5173/', dev)).toBe(true);
    expect(allowNavigation('http://localhost:5174/', dev)).toBe(false);
    expect(allowNavigation('https://example.com/', dev)).toBe(false);
    expect(allowNavigation('not a url', dev)).toBe(false);
  });
});
