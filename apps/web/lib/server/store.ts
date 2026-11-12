import 'server-only';
import { generateNotesFromCapture, getAdapter } from '../claude';
import type { MockScenario } from '../claude/mock';
import { AdapterError, type CaptureMediaType, type ChatTurn } from '../claude/types';
import {
  DEFAULT_TITLE,
  type Capture,
  type CaptureWithNotes,
  type Message,
  type Note,
  type PageDetail,
  type PageSummary,
} from '../types';
import { CAPTURE_BUCKET, dbFor } from './db';
import { HttpError } from './http';

type Row = Record<string, unknown>;

// A capture route may run 120 s (maxDuration); a capture still pending well after that lost its run.
const STALE_MS = 150_000;
const MAX_PAGES = 200;
const MAX_CHAT_NOTES = 500;

const str = (v: unknown) => (typeof v === 'string' ? v : '');
const num = (v: unknown) => (typeof v === 'number' ? v : Number(v ?? 0));
const optNum = (v: unknown) => (v === null || v === undefined ? null : Number(v));
const optStr = (v: unknown) => (typeof v === 'string' ? v : null);

const toPage = (r: Row): PageSummary => ({
  id: str(r.id),
  title: str(r.title),
  createdAt: str(r.created_at),
  updatedAt: str(r.updated_at),
});

const toMessage = (r: Row): Message => ({
  id: str(r.id),
  seq: num(r.seq),
  role: r.role === 'assistant' ? 'assistant' : 'user',
  content: str(r.content),
  createdAt: str(r.created_at),
});

const toCapture = (r: Row): Capture => ({
  id: str(r.id),
  pageId: str(r.page_id),
  status: r.status as Capture['status'],
  reason: optStr(r.reason),
  error: optStr(r.error),
  width: optNum(r.width),
  height: optNum(r.height),
  x: num(r.x),
  y: num(r.y),
  redacted: num(r.redacted),
  adapter: optStr(r.adapter),
  createdAt: str(r.created_at),
});

const toNote = (r: Row): Note => ({
  id: str(r.id),
  pageId: str(r.page_id),
  captureId: optStr(r.capture_id),
  source: r.source === 'drag-from-chat' ? 'drag-from-chat' : 'capture-vision',
  state: r.state === 'suggested' ? 'suggested' : 'placed',
  kind: r.kind as Note['kind'],
  text: str(r.text),
  sourceRegion: (optStr(r.source_region) as Note['sourceRegion']) ?? null,
  confidence: optNum(r.confidence),
  rawExcerpt: optStr(r.raw_excerpt),
  questionNo: optNum(r.question_no),
  ord: num(r.ord),
  x: num(r.x),
  y: num(r.y),
  createdAt: str(r.created_at),
  updatedAt: str(r.updated_at),
});

function check<T>(result: { data: T; error: { message: string } | null }, what: string): T {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
  return result.data;
}

const now = () => new Date().toISOString();

export async function listPages(visitor: string): Promise<PageSummary[]> {
  const rows = check(
    await dbFor(visitor)
      .from('web_pages')
      .select('id,title,created_at,updated_at')
      .order('updated_at', { ascending: false })
      .limit(100),
    'list pages',
  );
  return (rows ?? []).map(toPage);
}

export async function createPage(visitor: string, title?: string): Promise<PageSummary> {
  const count = await dbFor(visitor).from('web_pages').select('id', { count: 'exact', head: true });
  if (count.error) throw new Error(`count pages: ${count.error.message}`);
  if ((count.count ?? 0) >= MAX_PAGES) throw new HttpError(429, 'too_many_pages');
  const clean = title?.replace(/\s+/g, ' ').trim().slice(0, 80) || DEFAULT_TITLE;
  const row = check(
    await dbFor(visitor)
      .from('web_pages')
      .insert({ visitor_id: visitor, title: clean })
      .select('id,title,created_at,updated_at')
      .single(),
    'create page',
  );
  if (!row) throw new Error('create page: no row');
  return toPage(row);
}

async function requirePage(visitor: string, pageId: string): Promise<PageSummary> {
  const row = check(
    await dbFor(visitor)
      .from('web_pages')
      .select('id,title,created_at,updated_at')
      .eq('id', pageId)
      .maybeSingle(),
    'get page',
  );
  if (!row) throw new HttpError(404, 'page_not_found');
  return toPage(row);
}

export async function touchPage(visitor: string, pageId: string, title?: string) {
  const patch: Row = { updated_at: now() };
  if (title) patch.title = title.slice(0, 80);
  await dbFor(visitor).from('web_pages').update(patch).eq('id', pageId);
}

export async function renamePage(visitor: string, pageId: string, title: string) {
  const clean = title.replace(/\s+/g, ' ').trim().slice(0, 80);
  if (!clean) throw new HttpError(400, 'empty_title');
  await requirePage(visitor, pageId);
  await touchPage(visitor, pageId, clean);
}

export async function deletePage(visitor: string, pageId: string) {
  const db = dbFor(visitor);
  await requirePage(visitor, pageId);
  const caps = check(
    await db.from('web_captures').select('storage_path').eq('page_id', pageId),
    'page captures',
  );
  const paths = (caps ?? []).map((c) => str(c.storage_path)).filter(Boolean);
  if (paths.length) await db.storage.from(CAPTURE_BUCKET).remove(paths);
  check(await db.from('web_pages').delete().eq('id', pageId), 'delete page');
}

// A capture still pending after STALE_MS lost its run (the function was stopped); it shows as failed with a retry.
async function expireStale(visitor: string, captures: Row[]): Promise<Row[]> {
  const cutoff = Date.now() - STALE_MS;
  const stale = captures.filter(
    (c) => c.status === 'pending' && new Date(str(c.updated_at)).getTime() < cutoff,
  );
  if (!stale.length) return captures;
  const ids = stale.map((c) => str(c.id));
  // only rows still pending and still old: a run that just finished keeps its result
  await dbFor(visitor)
    .from('web_captures')
    .update({ status: 'failed', error: '시간이 너무 오래 걸렸어요.', updated_at: now() })
    .in('id', ids)
    .eq('status', 'pending')
    .lt('updated_at', new Date(cutoff).toISOString());
  return captures.map((c) =>
    ids.includes(str(c.id)) ? { ...c, status: 'failed', error: '시간이 너무 오래 걸렸어요.' } : c,
  );
}

export async function getPageDetail(visitor: string, pageId: string): Promise<PageDetail> {
  const db = dbFor(visitor);
  const page = await requirePage(visitor, pageId);
  // newest first under each cap, then back to reading order, so a long page drops its oldest rows
  const [messages, captures, notes] = await Promise.all([
    db.from('web_messages').select('*').eq('page_id', pageId).order('seq', { ascending: false }).limit(500),
    db.from('web_captures').select('*').eq('page_id', pageId).order('created_at', { ascending: false }).limit(200),
    db.from('web_notes').select('*').eq('page_id', pageId).order('created_at', { ascending: false }).limit(1000),
  ]);
  return {
    page,
    messages: (check(messages, 'messages') ?? []).reverse().map(toMessage),
    captures: (await expireStale(visitor, (check(captures, 'captures') ?? []).reverse())).map(toCapture),
    notes: (check(notes, 'notes') ?? []).reverse().map(toNote),
  };
}

export async function chatHistory(visitor: string, pageId: string, limit = 24): Promise<ChatTurn[]> {
  const rows = check(
    await dbFor(visitor)
      .from('web_messages')
      .select('role,content,seq')
      .eq('page_id', pageId)
      .order('seq', { ascending: false })
      .limit(limit),
    'history',
  );
  return (rows ?? [])
    .reverse()
    .map((r) => ({ role: r.role === 'assistant' ? 'assistant' : 'user', content: str(r.content) }));
}

export async function addMessage(
  visitor: string,
  pageId: string,
  role: 'user' | 'assistant',
  content: string,
): Promise<Message> {
  const db = dbFor(visitor);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const last = check(
      await db
        .from('web_messages')
        .select('seq')
        .eq('page_id', pageId)
        .order('seq', { ascending: false })
        .limit(1)
        .maybeSingle(),
      'last seq',
    );
    const seq = (last ? num(last.seq) : 0) + 1;
    const result = await db
      .from('web_messages')
      .insert({ page_id: pageId, visitor_id: visitor, seq, role, content: content.slice(0, 40000) })
      .select('*')
      .single();
    if (!result.error) return toMessage(result.data);
    if (!/duplicate|unique/i.test(result.error.message)) throw new Error(`add message: ${result.error.message}`);
  }
  throw new Error('add message: seq conflict');
}

// One chat message against the visitor's and everyone's daily allowance (db/0004_server_key_and_retry.sql).
export async function takeChat(visitor: string, limit: number): Promise<void> {
  const result = await dbFor(visitor).rpc('web_take_chat', { p_limit: limit });
  if (result.error) throw new Error(`chat allowance: ${result.error.message}`);
  if (result.data === 'daily_limit' || result.data === 'daily_total') throw new HttpError(429, result.data);
  if (result.data !== 'ok') throw new HttpError(401, 'invite_required');
}

export async function assertPage(visitor: string, pageId: string) {
  return requirePage(visitor, pageId);
}

export async function createCapture(
  visitor: string,
  pageId: string,
  file: { data: Uint8Array; mediaType: CaptureMediaType; width: number | null; height: number | null },
  at: { x: number; y: number },
  dailyLimit: number,
): Promise<Capture> {
  const db = dbFor(visitor);
  await requirePage(visitor, pageId);
  const ext = file.mediaType === 'image/png' ? 'png' : file.mediaType === 'image/webp' ? 'webp' : 'jpg';
  const path = `${visitor}/${pageId}/${crypto.randomUUID()}.${ext}`;
  const upload = await db.storage
    .from(CAPTURE_BUCKET)
    .upload(path, file.data, { contentType: file.mediaType, upsert: false });
  if (upload.error) throw new Error(`upload: ${upload.error.message}`);
  const created = await db.rpc('web_create_capture', {
    p_page: pageId,
    p_path: path,
    p_media: file.mediaType,
    p_bytes: file.data.byteLength,
    p_width: file.width,
    p_height: file.height,
    p_x: at.x,
    p_y: at.y,
    p_limit: dailyLimit,
  });
  if (created.error) {
    await db.storage.from(CAPTURE_BUCKET).remove([path]);
    if (/daily_limit/.test(created.error.message)) throw new HttpError(429, 'daily_limit');
    if (/daily_total/.test(created.error.message)) throw new HttpError(429, 'daily_total');
    if (/page_not_found/.test(created.error.message)) throw new HttpError(404, 'page_not_found');
    throw new Error(`create capture: ${created.error.message}`);
  }
  const row = (created.data as Row[] | null)?.[0];
  if (!row) throw new Error('create capture: no row');
  await touchPage(visitor, pageId);
  return toCapture(row);
}

const failure = (error: unknown): string => {
  if (error instanceof AdapterError) return error.message;
  if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError'))
    return '시간이 너무 오래 걸렸어요.';
  return '필기를 만들지 못했어요.';
};

// Runs after the upload response is sent (route handlers call it inside after()). The capture ends done, empty or
// failed; its suggested notes wait for the visitor to put them on the board. `deadline` is when the AI call must
// give up, set from the request's start so the result can still be written before the function is stopped.
export async function runCapture(
  visitor: string,
  captureId: string,
  deadline: number,
  scenario?: MockScenario,
) {
  const db = dbFor(visitor);
  const cap = check(
    await db.from('web_captures').select('*').eq('id', captureId).maybeSingle(),
    'run capture',
  );
  if (!cap) return;
  try {
    const page = await requirePage(visitor, str(cap.page_id));
    const file = await db.storage.from(CAPTURE_BUCKET).download(str(cap.storage_path));
    if (file.error || !file.data) throw new Error(`download: ${file.error?.message}`);
    const result = await generateNotesFromCapture(
      {
        data: new Uint8Array(await file.data.arrayBuffer()),
        mediaType: str(cap.media_type) as CaptureMediaType,
        width: optNum(cap.width),
        height: optNum(cap.height),
        topic: page.title === DEFAULT_TITLE ? null : page.title,
      },
      {
        adapter: getAdapter({ mockScenario: scenario }),
        signal: AbortSignal.timeout(Math.max(5_000, deadline - Date.now())),
      },
    );
    if (result.notes.length) {
      check(
        await db.from('web_notes').insert(
          result.notes.map((n, i) => ({
            page_id: cap.page_id,
            visitor_id: visitor,
            capture_id: captureId,
            source: 'capture-vision',
            state: 'suggested',
            kind: n.kind,
            text: n.text,
            source_region: n.source_region,
            confidence: n.confidence,
            raw_excerpt: n.raw_excerpt,
            ord: i,
          })),
        ),
        'insert notes',
      );
    }
    await db
      .from('web_captures')
      .update({
        status: result.notes.length ? 'done' : 'empty',
        reason: result.reason,
        error: null,
        adapter: result.adapter,
        model: result.model,
        redacted: result.redacted,
        updated_at: now(),
      })
      .eq('id', captureId);
  } catch (error) {
    if (error instanceof AdapterError) {
      if (error.code !== 'mock_failure') console.error('run capture', captureId, error.code, error.message);
    } else console.error('run capture', captureId, error);
    await db
      .from('web_captures')
      .update({ status: 'failed', error: failure(error), updated_at: now() })
      .eq('id', captureId);
  }
}

export async function getCapture(visitor: string, captureId: string): Promise<CaptureWithNotes> {
  const db = dbFor(visitor);
  const row = check(
    await db.from('web_captures').select('*').eq('id', captureId).maybeSingle(),
    'get capture',
  );
  if (!row) throw new HttpError(404, 'capture_not_found');
  const [fresh] = await expireStale(visitor, [row]);
  const notes = check(
    await db.from('web_notes').select('*').eq('capture_id', captureId).order('ord'),
    'capture notes',
  );
  return { capture: toCapture(fresh), notes: (notes ?? []).map(toNote) };
}

// Claimed in one statement in the database (web_retry_capture), so a double click cannot start two runs, and
// counted against the same daily limits as a new capture.
export async function retryCapture(visitor: string, captureId: string, dailyLimit: number): Promise<Capture> {
  const result = await dbFor(visitor).rpc('web_retry_capture', { p_capture: captureId, p_limit: dailyLimit });
  if (result.error) {
    const m = result.error.message;
    if (/capture_not_found/.test(m)) throw new HttpError(404, 'capture_not_found');
    if (/too_many_attempts/.test(m)) throw new HttpError(429, 'too_many_attempts');
    if (/daily_limit/.test(m)) throw new HttpError(429, 'daily_limit');
    if (/daily_total/.test(m)) throw new HttpError(429, 'daily_total');
    if (/cannot_retry/.test(m)) throw new HttpError(409, 'cannot_retry');
    throw new Error(`retry capture: ${m}`);
  }
  const row = (result.data as Row[] | null)?.[0];
  if (!row) throw new Error('retry capture: no row');
  return toCapture(row);
}

export async function moveCapture(visitor: string, captureId: string, at: { x: number; y: number }) {
  const result = await dbFor(visitor)
    .from('web_captures')
    .update({ x: at.x, y: at.y })
    .eq('id', captureId)
    .select('id');
  if (result.error) throw new Error(`move capture: ${result.error.message}`);
  if (!result.data?.length) throw new HttpError(404, 'capture_not_found');
}

export async function deleteCapture(visitor: string, captureId: string) {
  const db = dbFor(visitor);
  const row = check(
    await db.from('web_captures').select('storage_path').eq('id', captureId).maybeSingle(),
    'delete capture',
  );
  if (!row) throw new HttpError(404, 'capture_not_found');
  // notes already on the board stay; only the unchosen suggestions go with the capture
  await db.from('web_notes').update({ capture_id: null }).eq('capture_id', captureId).eq('state', 'placed');
  await db.storage.from(CAPTURE_BUCKET).remove([str(row.storage_path)]);
  check(await db.from('web_captures').delete().eq('id', captureId), 'delete capture row');
}

export async function readCaptureImage(visitor: string, captureId: string) {
  const db = dbFor(visitor);
  const row = check(
    await db.from('web_captures').select('storage_path,media_type').eq('id', captureId).maybeSingle(),
    'capture image',
  );
  if (!row) throw new HttpError(404, 'capture_not_found');
  const file = await db.storage.from(CAPTURE_BUCKET).download(str(row.storage_path));
  if (file.error || !file.data) throw new HttpError(404, 'image_not_found');
  return { body: await file.data.arrayBuffer(), type: str(row.media_type) };
}

export async function placeNotes(visitor: string, items: Array<{ id: string; x: number; y: number }>) {
  const db = dbFor(visitor);
  const placed: Note[] = [];
  for (const item of items.slice(0, 20)) {
    const result = await db
      .from('web_notes')
      .update({ state: 'placed', x: item.x, y: item.y, updated_at: now() })
      .eq('id', item.id)
      .select('*')
      .maybeSingle();
    if (result.error) throw new Error(`place note: ${result.error.message}`);
    if (result.data) placed.push(toNote(result.data));
  }
  return placed;
}

export async function moveNote(visitor: string, noteId: string, at: { x: number; y: number }) {
  const result = await dbFor(visitor)
    .from('web_notes')
    .update({ x: at.x, y: at.y, updated_at: now() })
    .eq('id', noteId)
    .select('*')
    .maybeSingle();
  if (result.error) throw new Error(`move note: ${result.error.message}`);
  if (!result.data) throw new HttpError(404, 'note_not_found');
  return toNote(result.data);
}

export async function deleteNote(visitor: string, noteId: string) {
  const result = await dbFor(visitor).from('web_notes').delete().eq('id', noteId).select('id');
  if (result.error) throw new Error(`delete note: ${result.error.message}`);
  if (!result.data?.length) throw new HttpError(404, 'note_not_found');
}

export async function createChatNote(
  visitor: string,
  pageId: string,
  input: { text: string; questionNo: number | null; x: number; y: number },
): Promise<Note> {
  await requirePage(visitor, pageId);
  const count = await dbFor(visitor)
    .from('web_notes')
    .select('id', { count: 'exact', head: true })
    .eq('page_id', pageId)
    .eq('source', 'drag-from-chat');
  if (count.error) throw new Error(`count notes: ${count.error.message}`);
  if ((count.count ?? 0) >= MAX_CHAT_NOTES) throw new HttpError(429, 'too_many_notes');
  const row = check(
    await dbFor(visitor)
      .from('web_notes')
      .insert({
        page_id: pageId,
        visitor_id: visitor,
        source: 'drag-from-chat',
        state: 'placed',
        kind: 'quote',
        text: input.text.slice(0, 4000),
        question_no: input.questionNo,
        x: input.x,
        y: input.y,
      })
      .select('*')
      .single(),
    'chat note',
  );
  await touchPage(visitor, pageId);
  return toNote(row);
}
