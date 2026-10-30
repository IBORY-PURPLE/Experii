import {
  app,
  BrowserWindow,
  Menu,
  nativeTheme,
  net,
  safeStorage,
  shell,
} from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { EVENT_AUTH } from './shared/ipc';
import { CardService } from './main/cards';
import { ChatService } from './main/chat';
import { Store } from './main/db';
import { registerHandlers } from './main/handlers';
import { StreamRegistry } from './main/ipc';
import { authFile, dbFile, devEnv, setupUserData } from './main/paths';
import {
  applySessionPolicy,
  handleAppProtocol,
  makeSenderCheck,
  registerSchemes,
  rendererUrl,
  windowPreferences,
} from './main/security';
import { Session, type TestAccount } from './main/session';
import { TokenStore } from './main/tokens';

if (started) app.quit();

// userData must be fixed before the single-instance lock, which is keyed on it.
setupUserData();
if (!app.requestSingleInstanceLock()) app.quit();
app.enableSandbox();
registerSchemes();
Menu.setApplicationMenu(null);

let mainWindow: BrowserWindow | null = null;
let store: Store | null = null;
const streams = new StreamRegistry();

const fetchImpl = (url: string, init: RequestInit) => net.fetch(url, init);

// Only allow-listed URLs leave the app; see handlers.USAGE_URL and the OAuth authorize URL.
const openExternal = async (url: string) => {
  const { origin } = new URL(url);
  if (origin !== 'https://chatgpt.com' && origin !== 'https://auth.openai.com')
    throw new Error('blocked external url');
  await shell.openExternal(url);
};

function testAccount(): TestAccount | null {
  const baseUrl = devEnv('EXPERII_API_BASE_URL');
  const token = devEnv('EXPERII_TEST_ACCESS_TOKEN');
  return baseUrl && token ? { baseUrl, token } : null;
}

// Zoom steps as Electron's menu takes them. Zooming in stops while the page would get smaller than the minimum
// window's content (1184x681 CSS px), so the three columns keep their widths; zooming out has a plain floor.
const ZOOM_STEP = 0.5;
const ZOOM_FLOOR = -2;
const MIN_PAGE = { width: 1184, height: 681 };

function zoomCeiling(win: BrowserWindow) {
  const [width, height] = win.getContentSize();
  const fit = Math.min(width / MIN_PAGE.width, height / MIN_PAGE.height);
  const level = Math.log(fit) / Math.log(1.2);
  return Math.max(0, Math.floor(level / ZOOM_STEP) * ZOOM_STEP);
}

function setZoom(win: BrowserWindow, level: number) {
  const clamped = Math.min(zoomCeiling(win), Math.max(ZOOM_FLOOR, level));
  if (clamped !== win.webContents.getZoomLevel())
    win.webContents.setZoomLevel(clamped);
}

// The app has no menu, so the keys its default menu carried are handled here: zoom and full screen in every
// build, reload and DevTools only in unpackaged runs.
function handleWindowKeys(win: BrowserWindow) {
  const page = win.webContents;
  page.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    const ctrl = input.control && !input.alt && !input.meta;
    const key = input.key.toLowerCase();
    const dev = !app.isPackaged;
    if (ctrl && (key === '=' || key === '+'))
      setZoom(win, page.getZoomLevel() + ZOOM_STEP);
    else if (ctrl && key === '-') setZoom(win, page.getZoomLevel() - ZOOM_STEP);
    else if (ctrl && key === '0') setZoom(win, 0);
    else if (key === 'f11') win.setFullScreen(!win.isFullScreen());
    else if (dev && ((ctrl && key === 'r') || key === 'f5')) page.reload();
    else if (dev && ((ctrl && input.shift && key === 'i') || key === 'f12'))
      page.toggleDevTools();
    else return;
    event.preventDefault();
  });
  win.on('resize', () => setZoom(win, page.getZoomLevel()));
}

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 720,
    title: 'Experii',
    backgroundColor: '#f8f9f9', // --bg-main in renderer/styles/tokens.css
    // A packaged build shows the icon in its exe; an unpackaged run would show Electron's.
    // The ICO rather than icon.png: Windows then picks the 16-24px drawings instead of shrinking the 256 tile.
    ...(app.isPackaged
      ? {}
      : { icon: path.join(__dirname, '..', '..', 'assets', 'icon.ico') }),
    webPreferences: windowPreferences(path.join(__dirname, 'preload.cjs')),
  });
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  handleWindowKeys(mainWindow);
  void mainWindow.loadURL(rendererUrl());
};

app.on('second-instance', () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
});

app.whenReady().then(() => {
  nativeTheme.themeSource = 'light';
  store = new Store(dbFile());
  const tokens = new TokenStore(authFile(), {
    isAvailable: () => safeStorage.isAsyncEncryptionAvailable(),
    encrypt: (plain) => safeStorage.encryptStringAsync(plain),
    decrypt: (cipher) => safeStorage.decryptStringAsync(cipher),
  });
  const session = new Session(
    store,
    tokens,
    fetchImpl,
    openExternal,
    () => mainWindow?.webContents.send(EVENT_AUTH),
    testAccount(),
  );
  const chat = new ChatService(store, session, streams, fetchImpl);
  const cards = new CardService(store, session, streams, fetchImpl);
  applySessionPolicy();
  handleAppProtocol();
  registerHandlers({
    store,
    session,
    chat,
    cards,
    streams,
    isTrusted: makeSenderCheck(() => mainWindow),
    openExternal,
  });
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => streams.cancelAll());

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  store?.close();
});
