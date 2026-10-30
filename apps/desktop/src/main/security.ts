import {
  app,
  protocol,
  session,
  type BrowserWindow,
  type IpcMainInvokeEvent,
} from 'electron';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  APP_HOST,
  CSP_PROD,
  MIME,
  allowNavigation,
  cspDev,
  resolveAssetPath,
} from './assets';

export const devServerUrl = (): string | undefined =>
  typeof MAIN_WINDOW_VITE_DEV_SERVER_URL === 'string' &&
  MAIN_WINDOW_VITE_DEV_SERVER_URL
    ? MAIN_WINDOW_VITE_DEV_SERVER_URL
    : undefined;

export function registerSchemes() {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'app',
      privileges: { standard: true, secure: true, supportFetchAPI: true },
    },
  ]);
}

export function rendererRoot() {
  return path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}`);
}

export function handleAppProtocol() {
  const root = rendererRoot();
  protocol.handle('app', async (request) => {
    const file = resolveAssetPath(root, request.url);
    if (!file) return new Response('not found', { status: 404 });
    try {
      const body = await readFile(file);
      return new Response(body, {
        headers: {
          'content-type':
            MIME[path.extname(file).toLowerCase()] ??
            'application/octet-stream',
          'content-security-policy': CSP_PROD,
          'x-content-type-options': 'nosniff',
        },
      });
    } catch {
      return new Response('not found', { status: 404 });
    }
  });
}

export function applySessionPolicy() {
  const dev = devServerUrl();
  const csp = dev ? cspDev(new URL(dev).origin) : CSP_PROD;
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp],
      },
    });
  });
  session.defaultSession.setPermissionRequestHandler(
    (_wc, permission, callback) =>
      callback(permission === 'clipboard-sanitized-write'),
  );
  session.defaultSession.setPermissionCheckHandler(
    (_wc, permission) => permission === 'clipboard-sanitized-write',
  );
  app.on('web-contents-created', (_event, contents) => {
    contents.on('will-navigate', (e) => {
      if (!allowNavigation(e.url, dev)) e.preventDefault();
    });
    contents.on('will-redirect', (e) => e.preventDefault());
    contents.on('will-attach-webview', (e) => e.preventDefault());
    contents.setWindowOpenHandler(() => ({ action: 'deny' }));
  });
}

export function windowPreferences(preload: string): Electron.WebPreferences {
  return {
    preload,
    contextIsolation: true,
    sandbox: true,
    nodeIntegration: false,
    webviewTag: false,
    spellcheck: false,
    devTools: !app.isPackaged,
  };
}

export function rendererUrl(): string {
  return devServerUrl() ?? `app://${APP_HOST}/index.html`;
}

// app:// gives URL.origin "null", so the check compares protocol and host instead of origin.
export function makeSenderCheck(getWindow: () => BrowserWindow | null) {
  return (event: IpcMainInvokeEvent): boolean => {
    const frame = event.senderFrame;
    const win = getWindow();
    if (!frame || !win || win.isDestroyed()) return false;
    if (frame !== win.webContents.mainFrame) return false;
    let url: URL;
    try {
      url = new URL(frame.url);
    } catch {
      return false;
    }
    const dev = devServerUrl();
    if (dev) return url.origin === new URL(dev).origin;
    return url.protocol === 'app:' && url.host === APP_HOST;
  };
}
