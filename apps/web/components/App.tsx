'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Capture, Message, Note, PageDetail, PageSummary } from '@/lib/types';
import { ApiError, api, errorText } from './api';
import { Board, TILE_W, tileHeight, type Uploading } from './Board';
import { DEFAULT_VIEW, type Point, type View } from './canvas';
import { ChatPanel, type Banner } from './ChatPanel';
import { REFUSALS, type Pick } from './collect';
import { Page } from './icons';
import { ImageError, prepareImage } from './image';
import { Pane, useLayout } from './Panes';
import { Sidebar } from './Sidebar';

type Toast = { text: string; key: number };

const KEYS = {
  active: 'experii.web.active.v1',
  intro: 'experii.web.intro.v1',
  sent: 'experii.web.first-capture.v1',
  views: 'experii.web.views.v1',
};

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // blocked storage only costs this browser's view state
  }
};

const IMAGE_ERRORS: Record<ImageError['code'], string> = {
  unsupported_type: 'png, jpg, webp 이미지만 올릴 수 있어요.',
  too_large: '이미지가 너무 커요. 화면의 필요한 부분만 캡쳐해 주세요.',
  unreadable: '이미지를 읽지 못했어요. 다시 캡쳐해 주세요.',
};

function loadViews(): Record<string, View> {
  try {
    const raw = JSON.parse(read(KEYS.views) ?? '{}') as Record<string, View>;
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

// The browser's own part: which page is open, how each board was last viewed, and whether the intro was read.
function Shell({ mock }: { mock: boolean }) {
  const { layout, setOpen } = useLayout(true);
  const [pages, setPages] = useState<PageSummary[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PageDetail | null>(null);
  const [uploading, setUploading] = useState<Uploading[]>([]);
  const [localImages, setLocalImages] = useState<Record<string, string>>({});
  const [stream, setStream] = useState<{ pageId: string; text: string } | null>(null);
  const [input, setInput] = useState('');
  const [banner, setBanner] = useState<Banner | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [intro, setIntro] = useState(() => !read(KEYS.intro));
  const [flash, setFlash] = useState<string | null>(null);
  const [reveal, setReveal] = useState<{ x: number; y: number; w: number; h: number; key: number } | null>(null);
  const [views, setViews] = useState<Record<string, View>>(loadViews);
  const [pick, setPick] = useState<(Pick & { key: number }) | null>(null);
  const abort = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // A note's move waits for its own placing to reach the server, so the two never land out of order.
  const placing = useRef(new Map<string, Promise<unknown>>());

  const showToast = useCallback((text: string, ms = 4000) => {
    clearTimeout(toastTimer.current);
    setToast({ text, key: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), ms);
  }, []);

  const failed = useCallback(
    (error: unknown, fallback: string) => {
      if (error instanceof ApiError && error.code === 'invite_required') {
        setBanner({
          tone: 'err',
          title: '초대 링크로 다시 들어와 주세요',
          body: '초대가 끝났거나 쿠키가 지워졌어요.',
          actions: [],
        });
        return;
      }
      showToast(errorText(error, fallback));
    },
    [showToast],
  );

  useEffect(() => {
    (async () => {
      try {
        let list = await api.listPages();
        if (list.length === 0) list = [await api.createPage()];
        setPages(list);
        const saved = read(KEYS.active);
        setActiveId(list.find((p) => p.id === saved)?.id ?? list[0].id);
      } catch (error) {
        setBanner({
          tone: 'err',
          title: '공부 페이지를 불러오지 못했어요',
          body: errorText(error, '잠시 뒤 새로고침해 주세요.'),
          actions: [{ label: '새로고침', run: () => location.reload() }],
        });
      }
    })();
  }, []);

  useEffect(() => {
    if (!activeId) return;
    let gone = false;
    setDetail(null);
    write(KEYS.active, activeId);
    api
      .getPage(activeId)
      .then((d) => !gone && setDetail(d))
      .catch((error) => !gone && failed(error, '페이지를 열지 못했어요.'));
    return () => {
      gone = true;
    };
  }, [activeId, failed]);

  const applyCapture = useCallback(
    (capture: Capture, notes: Note[]) => {
      setDetail((d) =>
        d && d.page.id === capture.pageId
          ? {
              ...d,
              captures: d.captures.map((c) => (c.id === capture.id ? capture : c)),
              notes: [...d.notes.filter((n) => n.captureId !== capture.id), ...notes],
            }
          : d,
      );
      if (capture.status === 'failed') showToast(capture.error ?? '필기를 만들지 못했어요.');
      else if (capture.redacted > 0) showToast(`비밀로 보이는 ${capture.redacted}곳을 가렸어요.`);
    },
    [showToast],
  );

  // Captures being read are asked about until their notes arrive.
  const pendingIds =
    detail?.captures
      .filter((c) => c.status === 'pending')
      .map((c) => c.id)
      .join(',') ?? '';
  useEffect(() => {
    if (!pendingIds) return;
    const ids = pendingIds.split(',');
    let busy = false;
    const timer = setInterval(async () => {
      if (busy) return;
      busy = true;
      try {
        for (const id of ids) {
          const { capture, notes } = await api.getCapture(id);
          if (capture.status !== 'pending') applyCapture(capture, notes);
        }
      } catch {
        // the next tick asks again
      } finally {
        busy = false;
      }
    }, 1200);
    return () => clearInterval(timer);
  }, [pendingIds, applyCapture]);

  const updateNotes = (fn: (notes: Note[]) => Note[]) =>
    setDetail((d) => (d ? { ...d, notes: fn(d.notes) } : d));

  const addCapture = async (file: File, at: Point) => {
    const page = detail?.page;
    if (!page) return;
    let prepared;
    try {
      prepared = await prepareImage(file);
    } catch (error) {
      showToast(error instanceof ImageError ? IMAGE_ERRORS[error.code] : IMAGE_ERRORS.unreadable);
      return;
    }
    const key = crypto.randomUUID();
    const url = URL.createObjectURL(prepared.blob);
    setUploading((u) => [...u, { key, ...at, url, width: prepared.width, height: prepared.height }]);
    setReveal({ ...at, w: TILE_W, h: tileHeight(prepared) + 48, key: Date.now() });
    if (!read(KEYS.sent)) {
      write(KEYS.sent, '1');
      showToast('캡쳐는 Experii 서버에 저장되고, 필기를 만들려고 AI로 보내요.', 7000);
    }
    const form = new FormData();
    form.append('file', prepared.blob, 'capture');
    form.append('x', String(at.x));
    form.append('y', String(at.y));
    form.append('width', String(prepared.width));
    form.append('height', String(prepared.height));
    try {
      const { capture } = await api.uploadCapture(page.id, form);
      setLocalImages((m) => ({ ...m, [capture.id]: url }));
      setDetail((d) => (d && d.page.id === page.id ? { ...d, captures: [...d.captures, capture] } : d));
      setFlash(capture.id);
    } catch (error) {
      URL.revokeObjectURL(url);
      failed(error, '캡쳐를 올리지 못했어요. 다시 붙여 넣어 주세요.');
    } finally {
      setUploading((u) => u.filter((x) => x.key !== key));
    }
  };

  const placeNotes = async (items: Array<{ id: string; x: number; y: number }>) => {
    const at = new Map(items.map((i) => [i.id, i]));
    const before = detail?.notes ?? [];
    updateNotes((notes) =>
      notes.map((n) => {
        const spot = at.get(n.id);
        return spot ? { ...n, state: 'placed', x: spot.x, y: spot.y, updatedAt: new Date().toISOString() } : n;
      }),
    );
    if (items.length === 1) setFlash(items[0].id);
    const request = api.placeNotes(items);
    for (const item of items) placing.current.set(item.id, request.catch(() => undefined));
    try {
      const placed = await request;
      const byId = new Map(placed.map((n) => [n.id, n]));
      // the board may have moved them since (settling the column), so the local spot wins
      updateNotes((notes) =>
        notes.map((n) => {
          const saved = byId.get(n.id);
          return saved ? { ...saved, x: n.x, y: n.y } : n;
        }),
      );
    } catch (error) {
      updateNotes(() => before);
      failed(error, '필기를 보드에 넣지 못했어요.');
    } finally {
      for (const item of items) placing.current.delete(item.id);
    }
  };

  // Words kept from an answer, as they are (drag-from-chat).
  const addChatNote = async (picked: Pick, at: Point) => {
    const page = detail?.page;
    if (!page || picked.pageId !== page.id) return;
    try {
      const note = await api.chatNote(page.id, picked.text, picked.q, at.x, at.y);
      setDetail((d) => (d && d.page.id === page.id ? { ...d, notes: [...d.notes, note] } : d));
      setFlash(note.id);
    } catch (error) {
      failed(error, '필기에 남기지 못했어요.');
    }
  };

  const removeNote = async (note: Note, done: string | null) => {
    updateNotes((notes) => notes.filter((n) => n.id !== note.id));
    try {
      await api.deleteNote(note.id);
      if (done) showToast(done);
    } catch (error) {
      updateNotes((notes) => [...notes, note]);
      failed(error, '지우지 못했어요.');
    }
  };

  const moveNote = async (note: Note, at: Point) => {
    updateNotes((notes) =>
      notes.map((n) => (n.id === note.id ? { ...n, ...at, updatedAt: new Date().toISOString() } : n)),
    );
    try {
      await placing.current.get(note.id);
      await api.moveNote(note.id, at.x, at.y);
    } catch (error) {
      updateNotes((notes) => notes.map((n) => (n.id === note.id ? note : n)));
      failed(error, '필기를 옮기지 못했어요.');
    }
  };

  const moveCapture = async (capture: Capture, at: Point) => {
    setDetail((d) =>
      d ? { ...d, captures: d.captures.map((c) => (c.id === capture.id ? { ...c, ...at } : c)) } : d,
    );
    try {
      await api.moveCapture(capture.id, at.x, at.y);
    } catch (error) {
      setDetail((d) =>
        d ? { ...d, captures: d.captures.map((c) => (c.id === capture.id ? capture : c)) } : d,
      );
      failed(error, '캡쳐를 옮기지 못했어요.');
    }
  };

  const deleteCapture = async (capture: Capture) => {
    const before = detail;
    setDetail((d) =>
      d
        ? {
            ...d,
            captures: d.captures.filter((c) => c.id !== capture.id),
            notes: d.notes
              .filter((n) => !(n.captureId === capture.id && n.state === 'suggested'))
              .map((n) => (n.captureId === capture.id ? { ...n, captureId: null } : n)),
          }
        : d,
    );
    try {
      await api.deleteCapture(capture.id);
      showToast('캡쳐를 지웠어요. 보드에 넣은 필기는 남아 있어요.');
    } catch (error) {
      setDetail(before);
      failed(error, '캡쳐를 지우지 못했어요.');
    }
  };

  const retry = async (capture: Capture) => {
    try {
      const fresh = await api.retryCapture(capture.id);
      setDetail((d) =>
        d
          ? {
              ...d,
              captures: d.captures.map((c) => (c.id === fresh.id ? fresh : c)),
              notes: d.notes.filter((n) => !(n.captureId === fresh.id && n.state === 'suggested')),
            }
          : d,
      );
    } catch (error) {
      failed(error, '다시 시도하지 못했어요.');
    }
  };

  const newPage = async () => {
    try {
      const page = await api.createPage();
      setPages((list) => [page, ...(list ?? [])]);
      setActiveId(page.id);
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch (error) {
      failed(error, '새 공부 페이지를 만들지 못했어요.');
    }
  };

  const send = async () => {
    const text = input.trim();
    const page = detail?.page;
    if (!text || !page || stream) return;
    setInput('');
    setBanner(null);
    const local: Message = {
      id: `local-${Date.now()}`,
      seq: (detail?.messages.at(-1)?.seq ?? 0) + 1,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setDetail((d) => (d && d.page.id === page.id ? { ...d, messages: [...d.messages, local] } : d));
    setStream({ pageId: page.id, text: '' });
    const ctrl = new AbortController();
    abort.current = ctrl;
    let answer = '';
    try {
      const res = await api.chat(page.id, text, ctrl.signal);
      if (!res.ok || !res.body) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new ApiError(res.status, body.error ?? `http_${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setStream({ pageId: page.id, text: answer });
      }
    } catch (error) {
      const aborted = error instanceof DOMException && error.name === 'AbortError';
      if (!aborted && !answer) {
        setDetail((d) => (d ? { ...d, messages: d.messages.filter((m) => m.id !== local.id) } : d));
        setInput(text);
        if (error instanceof ApiError && error.code === 'daily_limit')
          setBanner({
            tone: 'info',
            title: '오늘 대화 한도를 다 썼어요',
            body: '내일 다시 이어서 공부해 주세요. 보드의 필기는 그대로 남아 있어요.',
            actions: [],
          });
        else failed(error, '답을 받지 못했어요. 다시 보내 주세요.');
      }
    } finally {
      abort.current = null;
      setStream(null);
      if (answer.trim()) {
        const reply: Message = {
          id: `local-a-${Date.now()}`,
          seq: local.seq + 1,
          role: 'assistant',
          content: answer,
          createdAt: new Date().toISOString(),
        };
        setDetail((d) => (d && d.page.id === page.id ? { ...d, messages: [...d.messages, reply] } : d));
      }
      api
        .listPages()
        .then((list) => {
          setPages(list);
          const fresh = list.find((p) => p.id === page.id);
          if (fresh) setDetail((d) => (d && d.page.id === fresh.id ? { ...d, page: fresh } : d));
        })
        .catch(() => undefined);
    }
  };

  const closeIntro = () => {
    write(KEYS.intro, '1');
    setIntro(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const keepView = (pageId: string, v: View) =>
    setViews((all) => {
      const next = { ...all, [pageId]: v };
      write(KEYS.views, JSON.stringify(next));
      return next;
    });

  const page = detail?.page ?? null;
  const placedCount = detail?.notes.filter((n) => n.state === 'placed').length ?? 0;
  const pageTitle = page?.title ?? pages?.find((p) => p.id === activeId)?.title ?? null;

  return (
    <div
      className="app"
      data-sidebar={layout.sidebar ? 'open' : 'folded'}
      data-chat={layout.chat ? 'open' : 'folded'}
    >
      <Pane panel="sidebar" open={layout.sidebar} onOpen={() => setOpen('sidebar', true)}>
        <Sidebar
          pages={pages}
          activeId={activeId}
          onSelect={(id) => setActiveId(id)}
          onNew={() => void newPage()}
          onFold={() => setOpen('sidebar', false)}
        />
      </Pane>
      <main className="middle">
        <div className="tabbar">
          <div className="tabs" role="group" aria-label="열린 공부 페이지">
            <div className="tab page active">
              <div className="tab-main" aria-current="page">
                <span className="tab-icon">
                  <Page />
                </span>
                <span className="tab-title band-title">{pageTitle ?? '불러오는 중…'}</span>
                <span className="tab-label">필기 페이지 · 필기 {placedCount}개</span>
              </div>
            </div>
          </div>
        </div>
        <div className="view">
          {detail && page ? (
            <Board
              key={page.id}
              captures={detail.captures}
              notes={detail.notes}
              uploading={uploading}
              localImages={localImages}
              view={views[page.id] ?? DEFAULT_VIEW}
              intro={intro}
              flash={flash}
              reveal={reveal}
              pick={pick}
              onView={(v) => keepView(page.id, v)}
              onChatNote={(picked, at) => void addChatNote(picked, at)}
              onImage={(file, at) => void addCapture(file, at)}
              onPlace={(items) => void placeNotes(items)}
              onDismiss={(note) => void removeNote(note, null)}
              onMoveNote={(note, at) => void moveNote(note, at)}
              onDeleteNote={(note) => void removeNote(note, '필기를 지웠어요.')}
              onMoveCapture={(capture, at) => void moveCapture(capture, at)}
              onDeleteCapture={(capture) => void deleteCapture(capture)}
              onRetry={(capture) => void retry(capture)}
              onCloseIntro={closeIntro}
            />
          ) : (
            <div className="board-loading" role="status">
              <i className="spin" aria-hidden />
              필기 페이지를 여는 중…
            </div>
          )}
          {toast && (
            <div className="toast" role="status" key={toast.key}>
              <span>{toast.text}</span>
            </div>
          )}
        </div>
      </main>
      <Pane panel="chat" open={layout.chat} onOpen={() => setOpen('chat', true)}>
        <ChatPanel
          pageId={page?.id ?? null}
          title={pageTitle}
          messages={detail?.messages ?? null}
          streamingText={stream && stream.pageId === page?.id ? stream.text : null}
          banner={banner}
          input={input}
          inputRef={inputRef}
          mock={mock}
          onInput={setInput}
          onSend={() => void send()}
          onStop={() => abort.current?.abort()}
          onNewPage={() => void newPage()}
          onFold={() => setOpen('chat', false)}
          onAddNote={(picked) => setPick({ ...picked, key: Date.now() })}
          onNoteRefused={(why) => showToast(REFUSALS[why])}
        />
      </Pane>
    </div>
  );
}

// Everything here lives in the browser (localStorage, the layout), so it renders only once mounted.
export function App({ mock }: { mock: boolean }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? <Shell mock={mock} /> : <div className="app-loading" aria-busy="true" />;
}
