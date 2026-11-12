import { NextResponse } from 'next/server';
import { HttpError, UUID_RE, fail, finite, readJson, requireVisitor } from '@/lib/server/http';
import { placeNotes } from '@/lib/server/store';

export const dynamic = 'force-dynamic';

// [넣기] and [모두 넣기]: suggested notes become notes on the board at the spots the browser chose.
export async function POST(request: Request) {
  try {
    const visitor = await requireVisitor();
    const body = await readJson<{ notes?: unknown }>(request);
    if (!Array.isArray(body.notes) || body.notes.length === 0 || body.notes.length > 20)
      throw new HttpError(400, 'bad_notes');
    const items = body.notes.map((n) => {
      const o = n as { id?: unknown; x?: unknown; y?: unknown };
      if (typeof o.id !== 'string' || !UUID_RE.test(o.id)) throw new HttpError(400, 'bad_note_id');
      return { id: o.id, x: finite(o.x), y: finite(o.y) };
    });
    return NextResponse.json({ notes: await placeNotes(visitor, items) });
  } catch (error) {
    return fail(error);
  }
}
