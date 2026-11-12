import { z } from 'zod';

// prompt.md 5.1: one capture becomes zero to eight note blocks. The mock and the live adapter return this same shape.
export const NOTE_KINDS = ['concept', 'step', 'quote', 'warning', 'todo', 'other'] as const;
export const SOURCE_REGIONS = ['top', 'middle', 'bottom', 'full'] as const;
export const MAX_NOTES = 8;

export type NoteKind = (typeof NOTE_KINDS)[number];
export type SourceRegion = (typeof SOURCE_REGIONS)[number];

// What the model is asked to fill. Length and range limits are enforced after parsing (normalizeResult), since
// structured outputs accept only a subset of JSON Schema constraints.
export const NoteBlockSchema = z.object({
  text: z.string(),
  kind: z.enum(NOTE_KINDS),
  source_region: z.enum(SOURCE_REGIONS).nullable(),
  confidence: z.number().nullable(),
  raw_excerpt: z.string().nullable(),
});

export const CaptureNotesSchema = z.object({
  notes: z.array(NoteBlockSchema),
  reason: z.string().nullable(),
  redacted: z.number(),
});

export type NoteBlock = z.infer<typeof NoteBlockSchema>;
export type CaptureNotesResult = z.infer<typeof CaptureNotesSchema>;

export type CaptureMediaType = 'image/png' | 'image/jpeg' | 'image/webp';

export type CaptureInput = {
  data: Uint8Array;
  mediaType: CaptureMediaType;
  width: number | null;
  height: number | null;
  // what the learner was talking about, so the notes use the same words; never a source of facts
  topic?: string | null;
};

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

// The single seam between the app and Claude. Swapping the mock for the live adapter changes nothing else.
export interface ClaudeAdapter {
  readonly name: 'mock' | 'anthropic';
  readonly model: string;
  generateNotesFromCapture(input: CaptureInput, signal?: AbortSignal): Promise<CaptureNotesResult>;
  streamChat(turns: ChatTurn[], signal?: AbortSignal): AsyncIterable<string>;
}

export class AdapterError extends Error {
  constructor(
    readonly code: 'refused' | 'invalid_output' | 'rate_limited' | 'upstream' | 'mock_failure',
    message: string,
  ) {
    super(message);
    this.name = 'AdapterError';
  }
}
