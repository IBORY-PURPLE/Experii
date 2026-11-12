import type {
  Capture,
  CaptureWithNotes,
  Note,
  PageDetail,
  PageSummary,
} from '@/lib/types';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
  }
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const json = typeof init.body === 'string';
  const res = await fetch(path, {
    ...init,
    cache: 'no-store',
    headers: { ...(json ? { 'content-type': 'application/json' } : {}), ...init.headers },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(res.status, body.error ?? `http_${res.status}`);
  }
  return (await res.json()) as T;
}

const send = (method: string, body?: unknown): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
});

export const api = {
  listPages: () => call<{ pages: PageSummary[] }>('/api/pages').then((r) => r.pages),
  createPage: (title?: string) =>
    call<{ page: PageSummary }>('/api/pages', send('POST', { title })).then((r) => r.page),
  getPage: (id: string) => call<PageDetail>(`/api/pages/${id}`),
  renamePage: (id: string, title: string) => call(`/api/pages/${id}`, send('PATCH', { title })),
  deletePage: (id: string) => call(`/api/pages/${id}`, send('DELETE')),
  uploadCapture: (pageId: string, form: FormData) =>
    call<{ capture: Capture; adapter: string }>(`/api/pages/${pageId}/captures`, {
      method: 'POST',
      body: form,
    }),
  getCapture: (id: string) => call<CaptureWithNotes>(`/api/captures/${id}`),
  retryCapture: (id: string) =>
    call<{ capture: Capture }>(`/api/captures/${id}/retry`, send('POST', {})).then((r) => r.capture),
  moveCapture: (id: string, x: number, y: number) => call(`/api/captures/${id}`, send('PATCH', { x, y })),
  deleteCapture: (id: string) => call(`/api/captures/${id}`, send('DELETE')),
  placeNotes: (notes: Array<{ id: string; x: number; y: number }>) =>
    call<{ notes: Note[] }>('/api/notes/place', send('POST', { notes })).then((r) => r.notes),
  moveNote: (id: string, x: number, y: number) =>
    call<{ note: Note }>(`/api/notes/${id}`, send('PATCH', { x, y })).then((r) => r.note),
  deleteNote: (id: string) => call(`/api/notes/${id}`, send('DELETE')),
  chatNote: (pageId: string, text: string, questionNo: number | null, x: number, y: number) =>
    call<{ note: Note }>(`/api/pages/${pageId}/notes`, send('POST', { text, questionNo, x, y })).then(
      (r) => r.note,
    ),
  chat: (pageId: string, text: string, signal: AbortSignal) =>
    fetch(`/api/pages/${pageId}/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
      signal,
    }),
};

export const imageUrl = (captureId: string) => `/api/captures/${captureId}/image`;

export const ERRORS: Record<string, string> = {
  daily_limit: '오늘 쓸 수 있는 횟수를 다 썼어요. 내일 다시 이어서 해 주세요.',
  daily_total: '오늘은 쓰는 분이 많아서 잠시 멈췄어요. 내일 다시 해 주세요.',
  too_large: '이미지가 너무 커요. 화면의 필요한 부분만 캡쳐해 주세요.',
  unsupported_type: 'png, jpg, webp 이미지만 올릴 수 있어요.',
  invite_required: '초대 링크로 다시 들어와 주세요.',
  too_many_attempts: '같은 캡쳐는 세 번까지 다시 시도할 수 있어요.',
  still_running: '아직 필기를 만드는 중이에요.',
  message_too_long: '질문이 너무 길어요. 4,000자 안으로 줄여 주세요.',
  page_not_found: '이 공부 페이지를 찾지 못했어요.',
};

export const errorText = (error: unknown, fallback: string) =>
  error instanceof ApiError ? (ERRORS[error.code] ?? fallback) : fallback;
