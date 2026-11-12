import { NextResponse } from 'next/server';
import { fail, finite, readJson, requireId, requireVisitor } from '@/lib/server/http';
import { deleteCapture, getCapture, moveCapture } from '@/lib/server/store';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const visitor = await requireVisitor();
    const id = requireId((await params).id);
    return NextResponse.json(await getCapture(visitor, id));
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const visitor = await requireVisitor();
    const id = requireId((await params).id);
    const body = await readJson<{ x?: unknown; y?: unknown }>(request);
    await moveCapture(visitor, id, { x: finite(body.x), y: finite(body.y) });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const visitor = await requireVisitor();
    const id = requireId((await params).id);
    await deleteCapture(visitor, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
