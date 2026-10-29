import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { Store } from './main/db';
import { registerHandlers } from './main/handlers';
import { dbFile, setupUserData } from './main/paths';
import {
  applySessionPolicy,
  handleAppProtocol,
  makeSenderCheck,
  registerSchemes,
  rendererUrl,
  windowPreferences,
} from './main/security';

if (started) app.quit();

// userData must be fixed before the single-instance lock, which is keyed on it.
setupUserData();
if (!app.requestSingleInstanceLock()) app.quit();
app.enableSandbox();
registerSchemes();

let mainWindow: BrowserWindow | null = null;
let store: Store | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 720,
    title: 'Experii',
    backgroundColor: '#f2f4f7',
    autoHideMenuBar: true,
    webPreferences: windowPreferences(path.join(__dirname, 'preload.cjs')),
  });
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  void mainWindow.loadURL(rendererUrl());
};

app.on('second-instance', () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
});

app.whenReady().then(() => {
  store = new Store(dbFile());
  applySessionPolicy();
  handleAppProtocol();
  registerHandlers({ store, isTrusted: makeSenderCheck(() => mainWindow) });
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  store?.close();
});
