import { NextResponse } from 'next/server';
import { HttpError, fail, readJson, requireId, requireVisitor } from '@/lib/server/http';
import { deletePage, getPageDetail, renamePage } from '@/lib/server/store';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const visitor = await requireVisitor();
    const id = requireId((await params).id);
    return NextResponse.json(await getPageDetail(visitor, id));
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const visitor = await requireVisitor();
    const id = requireId((await params).id);
    const body = await readJson<{ title?: unknown }>(request);
    if (typeof body.title !== 'string') throw new HttpError(400, 'bad_title');
    await renamePage(visitor, id, body.title);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const visitor = await requireVisitor();
    const id = requireId((await params).id);
    await deletePage(visitor, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
