import { NextResponse } from 'next/server';
import { HttpError, fail, finite, readJson, requireId, requireVisitor } from '@/lib/server/http';
import { createChatNote } from '@/lib/server/store';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

// Words dragged from an answer onto the board (source drag-from-chat): kept as they are, as on the desktop (FR-16).
export async function POST(request: Request, { params }: Ctx) {
  try {
    const visitor = await requireVisitor();
    const id = requireId((await params).id);
    const body = await readJson<{ text?: unknown; questionNo?: unknown; x?: unknown; y?: unknown }>(request);
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    if (!text) throw new HttpError(400, 'empty_note');
    if (text.length > 4000) throw new HttpError(400, 'note_too_long');
    const q = Number(body.questionNo);
    const note = await createChatNote(visitor, id, {
      text,
      questionNo: Number.isInteger(q) && q > 0 ? q : null,
      x: finite(body.x),
      y: finite(body.y),
    });
    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
