import { NextResponse, after } from 'next/server';
import { adapterMode } from '@/lib/claude';
import { HttpError, fail, finite, requireId, requireVisitor } from '@/lib/server/http';
import { captureLimit, mockScenario } from '@/lib/server/limits';
import { createCapture, runCapture } from '@/lib/server/store';
import { sniffImage } from '@/lib/sniff';
import { MAX_UPLOAD_BYTES } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

type Ctx = { params: Promise<{ id: string }> };

const dimension = (value: FormDataEntryValue | null) => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 && n <= 20000 ? n : null;
};

// The upload answers at once with a pending capture; the notes are made after the response (after()), and the
// browser asks GET /api/captures/[id] until they are there.
export async function POST(request: Request, { params }: Ctx) {
  // the AI call gives up 100 s after the request came in, leaving time to write the result
  const deadline = Date.now() + 100_000;
  try {
    const visitor = await requireVisitor();
    const id = requireId((await params).id);
    const form = await request.formData().catch(() => {
      throw new HttpError(400, 'bad_form');
    });
    const file = form.get('file');
    if (!(file instanceof File) || file.size === 0) throw new HttpError(400, 'no_file');
    if (file.size > MAX_UPLOAD_BYTES) throw new HttpError(413, 'too_large');
    const data = new Uint8Array(await file.arrayBuffer());
    const mediaType = sniffImage(data);
    if (!mediaType) throw new HttpError(415, 'unsupported_type');

    const capture = await createCapture(
      visitor,
      id,
      { data, mediaType, width: dimension(form.get('width')), height: dimension(form.get('height')) },
      { x: finite(form.get('x')), y: finite(form.get('y')) },
      captureLimit(),
    );
    const scenario = mockScenario(request.headers.get('x-experii-mock'));
    after(() => runCapture(visitor, capture.id, deadline, scenario));
    return NextResponse.json({ capture, adapter: adapterMode() }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
