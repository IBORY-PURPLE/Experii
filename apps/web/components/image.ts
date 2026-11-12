import { ACCEPTED_TYPES, MAX_EDGE, MAX_UPLOAD_BYTES } from '@/lib/types';

export type Prepared = { blob: Blob; width: number; height: number };

export class ImageError extends Error {
  constructor(readonly code: 'unsupported_type' | 'too_large' | 'unreadable') {
    super(code);
  }
}

const MAX_SOURCE_BYTES = 20 * 1024 * 1024;

const encode = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

// A capture is scaled so its long edge is at most MAX_EDGE and re-encoded (webp, else jpeg) to fit the upload limit.
export async function prepareImage(file: Blob): Promise<Prepared> {
  if (!(ACCEPTED_TYPES as readonly string[]).includes(file.type)) throw new ImageError('unsupported_type');
  if (file.size > MAX_SOURCE_BYTES) throw new ImageError('too_large');
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new ImageError('unreadable');
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  if (scale === 1 && file.size <= MAX_UPLOAD_BYTES) {
    bitmap.close();
    return { blob: file, width, height };
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ImageError('unreadable');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  for (const [type, quality] of [
    ['image/webp', 0.9],
    ['image/jpeg', 0.88],
    ['image/jpeg', 0.75],
  ] as const) {
    const blob = await encode(canvas, type, quality);
    if (blob && blob.type === type && blob.size <= MAX_UPLOAD_BYTES) return { blob, width, height };
  }
  throw new ImageError('too_large');
}

export function imageFrom(data: DataTransfer | null): File | null {
  if (!data) return null;
  for (const item of Array.from(data.items ?? [])) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) return file;
    }
  }
  for (const file of Array.from(data.files ?? [])) if (file.type.startsWith('image/')) return file;
  return null;
}
