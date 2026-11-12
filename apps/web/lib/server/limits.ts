import 'server-only';
import { adapterMode } from '../claude';
import { MOCK_SCENARIOS, type MockScenario } from '../claude/mock';

const clampInt = (raw: string | undefined, fallback: number, max: number) => {
  const n = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, max) : fallback;
};

// The database caps these again (db/0003_quota.sql): 50 captures and 200 messages per visitor a day.
export const captureLimit = () => clampInt(process.env.CAPTURE_DAILY_LIMIT, 30, 50);
export const chatLimit = () => clampInt(process.env.CHAT_DAILY_LIMIT, 100, 200);

// Tests ask the mock for a failure or an empty result; the live adapter ignores the header.
export function mockScenario(header: string | null): MockScenario | undefined {
  if (adapterMode() !== 'mock' || !header) return undefined;
  return MOCK_SCENARIOS.find((s) => s === header);
}
