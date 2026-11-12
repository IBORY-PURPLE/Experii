import { NextResponse, after } from 'next/server';
import { fail, requireId, requireVisitor } from '@/lib/server/http';
import { mockScenario } from '@/lib/server/limits';
import { retryCapture, runCapture } from '@/lib/server/store';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Ctx) {
  try {
    const visitor = await requireVisitor();
    const id = requireId((await params).id);
    const capture = await retryCapture(visitor, id);
    const scenario = mockScenario(request.headers.get('x-experii-mock'));
    after(() => runCapture(visitor, id, scenario));
    return NextResponse.json({ capture });
  } catch (error) {
    return fail(error);
  }
}
