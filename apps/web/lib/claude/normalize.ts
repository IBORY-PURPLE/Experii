import { redactText } from '../redact';
import {
  CaptureNotesSchema,
  MAX_NOTES,
  NOTE_KINDS,
  SOURCE_REGIONS,
  type CaptureNotesResult,
  type NoteBlock,
} from './types';

const MAX_TEXT = 400;
const MAX_EXCERPT = 800;
const MAX_REASON = 200;

// by code points, so an emoji is never cut in half
const clip = (s: string, n: number) => {
  const chars = Array.from(s);
  return chars.length > n ? `${chars.slice(0, n - 1).join('')}…` : s;
};

// Whatever an adapter returns passes through here before it is stored: the schema is checked, limits applied,
// secrets masked once more, and an empty result always carries a reason (prompt.md 5.2 rule 5).
export function normalizeResult(raw: unknown): CaptureNotesResult {
  const parsed = CaptureNotesSchema.parse(raw);
  let redacted = Math.max(0, Math.floor(Number.isFinite(parsed.redacted) ? parsed.redacted : 0));
  const notes: NoteBlock[] = [];
  for (const n of parsed.notes) {
    const text = n.text.trim();
    if (!text) continue;
    const cleanText = redactText(clip(text, MAX_TEXT));
    const excerpt = n.raw_excerpt?.trim() ? redactText(clip(n.raw_excerpt.trim(), MAX_EXCERPT)) : null;
    redacted += cleanText.count + (excerpt?.count ?? 0);
    notes.push({
      text: cleanText.text,
      kind: NOTE_KINDS.includes(n.kind) ? n.kind : 'other',
      source_region: n.source_region && SOURCE_REGIONS.includes(n.source_region) ? n.source_region : null,
      confidence:
        n.confidence === null || !Number.isFinite(n.confidence)
          ? null
          : Math.min(1, Math.max(0, n.confidence)),
      raw_excerpt: excerpt?.text ?? null,
    });
    if (notes.length === MAX_NOTES) break;
  }
  const reason = parsed.reason?.trim()
    ? clip(parsed.reason.trim(), MAX_REASON)
    : notes.length === 0
      ? '이미지에서 필기로 남길 학습 내용을 찾지 못했어요.'
      : null;
  return { notes, reason, redacted };
}
