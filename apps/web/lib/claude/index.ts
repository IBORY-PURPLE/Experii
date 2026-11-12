import 'server-only';
import { createAnthropicAdapter, type Effort } from './anthropic';
import { createMockAdapter, type MockScenario } from './mock';
import { normalizeResult } from './normalize';
import type { CaptureInput, CaptureNotesResult, ClaudeAdapter } from './types';

const EFFORTS: Effort[] = ['low', 'medium', 'high', 'xhigh', 'max'];

export const DEFAULT_MODEL = 'claude-opus-5-5';

// Mock unless the founder has switched to the live adapter and given it a key (docs/web/tsd.md, 실연동).
export function adapterMode(): 'mock' | 'anthropic' {
  return process.env.CLAUDE_ADAPTER === 'anthropic' && !!process.env.ANTHROPIC_API_KEY
    ? 'anthropic'
    : 'mock';
}

export function getAdapter(opts: { mockScenario?: MockScenario } = {}): ClaudeAdapter {
  if (adapterMode() === 'anthropic') {
    return createAnthropicAdapter({
      apiKey: process.env.ANTHROPIC_API_KEY!,
      model: process.env.CLAUDE_MODEL?.trim() || DEFAULT_MODEL,
      effort: EFFORTS.find((e) => e === process.env.CLAUDE_EFFORT),
    });
  }
  const delay = Number(process.env.MOCK_DELAY_MS);
  return createMockAdapter({
    scenario: opts.mockScenario,
    delayMs: process.env.MOCK_DELAY_MS && Number.isFinite(delay) && delay >= 0 ? delay : undefined,
  });
}

// prompt.md 4.1: the one call the rest of the app makes. The output always meets the 5.1 contract.
export async function generateNotesFromCapture(
  input: CaptureInput,
  opts: { adapter?: ClaudeAdapter; signal?: AbortSignal } = {},
): Promise<CaptureNotesResult & { adapter: string; model: string }> {
  const adapter = opts.adapter ?? getAdapter();
  const raw = await adapter.generateNotesFromCapture(input, opts.signal);
  return { ...normalizeResult(raw), adapter: adapter.name, model: adapter.model };
}
