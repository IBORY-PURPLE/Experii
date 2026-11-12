import { fail, requireId, requireVisitor } from '@/lib/server/http';
import { readCaptureImage } from '@/lib/server/store';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const visitor = await requireVisitor();
    const id = requireId((await params).id);
    const image = await readCaptureImage(visitor, id);
    return new Response(image.body, {
      headers: {
        'content-type': image.type,
        'cache-control': 'private, max-age=86400, immutable',
        'x-content-type-options': 'nosniff',
      },
    });
  } catch (error) {
    return fail(error);
  }
}
