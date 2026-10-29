import { app } from 'electron';
import path from 'node:path';

// EXPERII_* variables are test hooks; a packaged build never reads them.
export function devEnv(name: string): string | undefined {
  return app.isPackaged ? undefined : process.env[name] || undefined;
}

export function setupUserData() {
  const override = devEnv('EXPERII_USER_DATA');
  const dir =
    override ??
    path.join(
      app.getPath('appData'),
      app.isPackaged ? 'Experii' : 'Experii-dev',
    );
  app.setPath('userData', dir);
}

export const dbFile = () => path.join(app.getPath('userData'), 'experii.db');
export const authFile = () => path.join(app.getPath('userData'), 'auth.bin');
