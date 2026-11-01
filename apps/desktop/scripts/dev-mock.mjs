// Starts the mock Responses API and runs the app against it, so the whole flow works without a ChatGPT sign-in.
// Usage: npm run dev:mock   (data goes to %APPDATA%/Experii-dev, separate from the real app)
// MOCK_CARD_DELAY=40 streams the card in 6-character pieces 40 ms apart, to watch it fill in field by field.
import { spawn } from 'node:child_process';
import {
  MOCK_TOKEN,
  TRIGGERS,
  startMockOpenAI,
} from '../tests/e2e/mock-openai.ts';

const mock = await startMockOpenAI({
  port: Number(process.env.MOCK_PORT ?? 8787),
  cardDelay: Number(process.env.MOCK_CARD_DELAY ?? 0),
});
console.log(`[dev:mock] mock OpenAI on ${mock.url}`);
console.log(`[dev:mock] error triggers: ${Object.values(TRIGGERS).join(' ')}`);

const app = spawn('npx', ['electron-forge', 'start'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: {
    ...process.env,
    EXPERII_API_BASE_URL: mock.url,
    EXPERII_TEST_ACCESS_TOKEN: MOCK_TOKEN,
  },
});
app.on('exit', async (code) => {
  await mock.close();
  process.exit(code ?? 0);
});
