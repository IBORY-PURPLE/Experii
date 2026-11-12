import { NextResponse } from 'next/server';
import { fail, finite, readJson, requireId, requireVisitor } from '@/lib/server/http';
import { deleteNote, moveNote } from '@/lib/server/store';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const visitor = await requireVisitor();
    const id = requireId((await params).id);
    const body = await readJson<{ x?: unknown; y?: unknown }>(request);
    return NextResponse.json({ note: await moveNote(visitor, id, { x: finite(body.x), y: finite(body.y) }) });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const visitor = await requireVisitor();
    const id = requireId((await params).id);
    await deleteNote(visitor, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
