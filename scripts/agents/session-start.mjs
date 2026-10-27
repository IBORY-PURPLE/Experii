// SessionStart hook. In cloud sessions only: install landing dependencies and make sure Playwright's Chromium and
// ffmpeg (video evidence) match the locked @playwright/test version; the environment's setup script caches them.
// Local sessions exit at once.
import { execSync } from 'node:child_process';
import { openSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.env.CLAUDE_CODE_REMOTE !== 'true') process.exit(0);

const landing = resolve(dirname(fileURLToPath(import.meta.url)), '../../landing');
const log = openSync(join(landing, '..', '.session-start.log'), 'w');
const run = (cmd) => execSync(cmd, { cwd: landing, stdio: ['ignore', log, log] });

try {
  run('npm ci --no-audit --no-fund');
  run('npx playwright install chromium ffmpeg');
  console.log('session-start: landing deps installed, Playwright Chromium and ffmpeg ready.');
} catch (err) {
  console.log(`session-start: setup failed (${err.message.split('\n')[0]}). See .session-start.log before running gates.`);
}
