import { NextResponse } from 'next/server';
import { fail, requireVisitor } from '@/lib/server/http';
import { createPage, listPages } from '@/lib/server/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const visitor = await requireVisitor();
    return NextResponse.json({ pages: await listPages(visitor) });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const visitor = await requireVisitor();
    const body = (await request.json().catch(() => ({}))) as { title?: unknown };
    const page = await createPage(visitor, typeof body.title === 'string' ? body.title : undefined);
    return NextResponse.json({ page }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
