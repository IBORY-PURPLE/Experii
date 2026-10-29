import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveAssetPath } from '../../src/main/assets';

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
