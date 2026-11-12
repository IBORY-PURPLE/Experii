import type { NoteKind, SourceRegion } from './claude/types';

// What the browser receives. Server rows are mapped to these in lib/server/store.ts.
export type PageSummary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type Message = {
  id: string;
  seq: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

export type CaptureStatus = 'pending' | 'done' | 'empty' | 'failed';

export type Capture = {
  id: string;
  pageId: string;
  status: CaptureStatus;
  reason: string | null;
  error: string | null;
  width: number | null;
  height: number | null;
  x: number;
  y: number;
  redacted: number;
  adapter: string | null;
  createdAt: string;
};

export type NoteSource = 'drag-from-chat' | 'capture-vision';

export type Note = {
  id: string;
  pageId: string;
  captureId: string | null;
  source: NoteSource;
  state: 'suggested' | 'placed';
  kind: NoteKind;
  text: string;
  sourceRegion: SourceRegion | null;
  confidence: number | null;
  rawExcerpt: string | null;
  questionNo: number | null;
  ord: number;
  x: number;
  y: number;
  createdAt: string;
  updatedAt: string;
};

export type PageDetail = {
  page: PageSummary;
  messages: Message[];
  captures: Capture[];
  notes: Note[];
};

export type CaptureWithNotes = { capture: Capture; notes: Note[] };

export const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
// Vercel functions take request bodies up to about 4.5 MB; the browser shrinks captures to stay under this.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
// Long edge the browser scales a capture down to before upload: enough for screen text, and a cap on image tokens.
export const MAX_EDGE = 2048;
export const MAX_MESSAGE_CHARS = 4000;
export const DEFAULT_TITLE = '새 공부';
