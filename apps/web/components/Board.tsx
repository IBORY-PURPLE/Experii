'use client';

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type DragEvent,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import type { NoteKind } from '@/lib/claude/types';
import type { Capture, Note } from '@/lib/types';
import { imageUrl } from './api';
import { NOTE_W, toWorld, zoomAt, type Point, type View } from './canvas';
import { carriesNote, readDrop, type Pick } from './collect';
import { Close, Hand, Minus, Page, Picture, Plus, Pointer, Retry } from './icons';
import { imageFrom } from './image';

export const TILE_W = 360;
const GAP = 24;
const LOW_CONFIDENCE = 0.6;

export const KIND_LABEL: Record<NoteKind, string> = {
  concept: '개념',
  step: '단계',
  quote: '인용',
  warning: '주의',
  todo: '할 일',
  other: '메모',
};

// A capture that is still on its way up: drawn at once from the local file, before the server knows it.
export type Uploading = { key: string; x: number; y: number; url: string; width: number; height: number };

type Tool = 'select' | 'hand';
type Target = 'note' | 'capture';
type Gesture =
  | { kind: 'pan'; from: Point; view: View }
  | { kind: 'move'; target: Target; id: string; from: Point; origin: Point; moved: boolean };

type Props = {
  captures: Capture[];
  notes: Note[];
  uploading: Uploading[];
  localImages: Record<string, string>;
  view: View;
  intro: boolean;
  flash: string | null;
  reveal: { x: number; y: number; w: number; h: number; key: number } | null;
  // words picked with [필기에 추가]: placed once, by key, in a free spot on screen
  pick: (Pick & { key: number }) | null;
  onView(v: View): void;
  onChatNote(pick: Pick, at: Point): void;
  onImage(file: File, at: Point): void;
  onPlace(items: Array<{ id: string; x: number; y: number }>): void;
  onDismiss(note: Note): void;
  onMoveNote(note: Note, at: Point): void;
  onDeleteNote(note: Note): void;
  onMoveCapture(capture: Capture, at: Point): void;
  onDeleteCapture(capture: Capture): void;
  onRetry(capture: Capture): void;
  onCloseIntro(): void;
};

const TOOLS: Array<{ id: Tool; label: string; icon: ReactNode }> = [
  { id: 'select', label: '선택', icon: <Pointer size={20} /> },
  { id: 'hand', label: '손 (화면 이동)', icon: <Hand size={20} /> },
];

const typing = (t: EventTarget | null) =>
  t instanceof HTMLElement && !!t.closest('input, textarea, select, [contenteditable="true"]');

export const tileHeight = (c: { width: number | null; height: number | null }) =>
  c.width && c.height ? Math.max(120, Math.min(480, Math.round((TILE_W * c.height) / c.width))) : 240;

// Rough height of a note before it is drawn (16 Korean characters to a line); placed notes settle after drawing.
const estimate = (text: string) =>
  56 + text.split('\n').reduce((n, line) => n + Math.max(1, Math.ceil(line.length / 16)), 0) * 21;

// A capture and the column its notes go into, side by side.
const GROUP_W = TILE_W + GAP + NOTE_W;

export function timeLabel(at: string, now = Date.now()): string {
  const d = new Date(at);
  const time = d.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });
  return d.toDateString() === new Date(now).toDateString()
    ? time
    : `${d.getMonth() + 1}월 ${d.getDate()}일 ${time}`;
}

function Intro(p: { onClose(): void }) {
  return (
    <section className="intro" aria-labelledby="intro-title">
      <p className="intro-eyebrow">Experii 웹 · 처음 오셨네요</p>
      <h2 id="intro-title">지금까지 공부 어떻게 했어요?</h2>
      <p className="intro-lead">
        여기서는 필기하느라 흐름을 끊지 않아도 돼요. AI와 대화한 뒤 남기고 싶은 화면을 캡쳐해서
        붙여 넣기만 하세요. 필기는 자동으로 해 드려요.
      </p>
      <ol className="intro-steps">
        <li>
          <b>오른쪽 AI와 대화하며 공부해요</b>
          <span className="only-wide">궁금한 걸 바로 물어보세요.</span>
          <span className="only-narrow">화면 오른쪽 끝의 ‹ 를 누르면 대화가 열려요.</span>
        </li>
        <li>
          <b>남기고 싶은 화면을 캡쳐해요</b>
          <span className="only-wide">
            Windows는 <kbd>Win</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd>, Mac은 <kbd>Cmd</kbd>+
            <kbd>Shift</kbd>+<kbd>4</kbd>
          </span>
          <span className="only-narrow">휴대폰 화면 캡쳐나 사진이면 돼요.</span>
        </li>
        <li>
          <b>이 보드에 붙여 넣어요</b>
          <span className="only-wide">
            <kbd>Ctrl</kbd>+<kbd>V</kbd>를 누르면 AI가 필기를 제안하고, 고른 것만 보드에 남아요.
          </span>
          <span className="only-narrow">
            아래 그림 버튼으로 올리면 AI가 필기를 제안하고, 고른 것만 보드에 남아요.
          </span>
        </li>
      </ol>
      <p className="intro-note">
        캡쳐는 Experii 서버에 저장되고, 필기를 만들려고 AI로 보내요. 비밀번호나 개인정보가 보이는
        화면은 올리지 마세요.
      </p>
      <button className="btn primary large" onClick={p.onClose}>
        바로 공부 시작하기
      </button>
    </section>
  );
}

function CaptureStatus(p: { capture: Capture; suggested: number; placed: number; onRetry(): void }) {
  const { capture: c } = p;
  if (c.status === 'pending')
    return (
      <p className="cap-status" role="status">
        <i className="spin" aria-hidden />
        AI가 필기를 만드는 중…
      </p>
    );
  if (c.status === 'failed')
    return (
      <div className="cap-status err" role="alert">
        <span>{c.error ?? '필기를 만들지 못했어요.'}</span>
        <button className="btn small" onClick={p.onRetry}>
          <Retry />
          다시 시도
        </button>
      </div>
    );
  if (c.status === 'empty')
    return <p className="cap-status muted">{c.reason ?? '필기로 남길 학습 내용을 찾지 못했어요.'}</p>;
  return (
    <p className="cap-status muted">
      {p.suggested > 0 ? `AI 필기 제안 ${p.suggested}개` : `필기 ${p.placed}개를 보드에 넣었어요`}
      {c.redacted > 0 && ` · 비밀로 보이는 ${c.redacted}곳을 가렸어요`}
    </p>
  );
}

export function Board(p: Props) {
  const board = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [view, setLiveView] = useState(p.view);
  const viewRef = useRef(view);
  const [tool, setTool] = useState<Tool>('select');
  const [space, setSpace] = useState(false);
  const [panning, setPanning] = useState(false);
  const [moved, setMoved] = useState<{ target: Target; id: string; at: Point } | null>(null);
  const [front, setFront] = useState<string | null>(null);
  const [dropping, setDropping] = useState<'image' | 'words' | null>(null);
  const gesture = useRef<Gesture | null>(null);
  const over = useRef(false);
  const revealed = useRef<number | null>(null);
  const settling = useRef<{ ids: string[]; y: number; capture: string; below: boolean } | null>(null);
  const picked = useRef<number | null>(null);
  const settle = useRef<ReturnType<typeof setTimeout>>(undefined);
  const latest = useRef(p);
  latest.current = p;

  const setView = (v: View) => {
    viewRef.current = v;
    setLiveView(v);
  };
  const keepView = (v: View) => {
    setView(v);
    latest.current.onView(v);
  };

  const local = (e: { clientX: number; clientY: number }): Point => {
    const r = canvas.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const placed = p.notes.filter((n) => n.state === 'placed');
  const drawn = (id: string) =>
    board.current?.querySelector<HTMLElement>(`[data-id="${id}"]`) ?? null;

  // Moves (and on a narrow screen zooms out) the view so a box of the world is on screen.
  const bringIntoView = (r: { x: number; y: number; w: number; h: number }) => {
    const c = canvas.current;
    if (!c) return;
    let v = viewRef.current;
    const room = c.clientWidth - 32;
    if (r.w * v.z > room) v = { ...v, z: Math.max(0.75, room / r.w) };
    const l = r.x * v.z + v.x;
    const t = r.y * v.z + v.y;
    const w = r.w * v.z;
    const h = r.h * v.z;
    const dx =
      l < 16 ? 16 - l : l + w > c.clientWidth - 16 ? Math.max(16 - l, c.clientWidth - 16 - l - w) : 0;
    const dy =
      t < 16 ? 16 - t : t + h > c.clientHeight - 76 ? Math.max(16 - t, c.clientHeight - 76 - t - h) : 0;
    if (dx || dy || v !== viewRef.current) keepView({ ...v, x: v.x + dx, y: v.y + dy });
  };

  // Where a pasted capture goes: the middle of what is on screen with room for its notes on the right, stepped
  // aside from a capture already there.
  const freeSpot = (): Point => {
    const c = canvas.current;
    const v = viewRef.current;
    const w = c?.clientWidth ?? 800;
    const at = toWorld(v, { x: w / 2, y: 48 });
    let x = Math.round(at.x - (w / v.z >= GROUP_W + 32 ? GROUP_W : TILE_W) / 2);
    let y = Math.round(at.y);
    const taken = (px: number, py: number) =>
      latest.current.captures.some((cap) => Math.abs(cap.x - px) < 40 && Math.abs(cap.y - py) < 40) ||
      latest.current.uploading.some((u) => Math.abs(u.x - px) < 40 && Math.abs(u.y - py) < 40);
    while (taken(x, y)) {
      x += 40;
      y += 40;
    }
    return { x, y };
  };

  // On a phone-width board the notes go under the capture card instead of beside it, so nothing has to shrink.
  const narrow = () => (canvas.current?.clientWidth ?? 1000) < 560;
  const columnX = (c: Capture, below: boolean) =>
    Math.round(below ? c.x + (TILE_W - NOTE_W) / 2 : c.x + TILE_W + GAP);
  const cardBottom = (c: Capture) => c.y + (drawn(c.id)?.offsetHeight ?? tileHeight(c) + 40) + 16;

  // A capture's notes go in a column at its right (or under it on a phone), each under the one before.
  const spots = (c: Capture, texts: string[], below: boolean): Point[] => {
    const x = columnX(c, below);
    const top = below ? cardBottom(c) : c.y;
    const column = placed.filter((n) => Math.abs(n.x - x) < NOTE_W / 2 && n.y >= top - 8);
    let y = Math.max(
      top,
      ...column.map((n) => Math.round(n.y + (drawn(n.id)?.offsetHeight ?? estimate(n.text)) + 12)),
    );
    return texts.map((t) => {
      const at = { x, y };
      y += estimate(t) + 12;
      return at;
    });
  };

  const place = (c: Capture, list: Note[]) => {
    const below = narrow();
    const at = spots(
      c,
      list.map((n) => n.text),
      below,
    );
    settling.current = { ids: list.map((n) => n.id), y: at[0].y, capture: c.id, below };
    p.onPlace(list.map((n, i) => ({ id: n.id, ...at[i] })));
    const last = at[at.length - 1];
    if (below) {
      bringIntoView({ x: at[0].x, y: at[0].y, w: NOTE_W, h: Math.min(320, last.y - at[0].y + 120) });
      return;
    }
    const top = Math.min(c.y, at[0].y);
    const bottom = Math.max(c.y + tileHeight(c) + 48, last.y + estimate(list[list.length - 1].text));
    bringIntoView({ x: c.x, y: top, w: GROUP_W, h: bottom - top });
  };

  // Notes just put on the board are stacked again by their drawn heights, so the column has even gaps.
  useEffect(() => {
    const s = settling.current;
    if (!s) return;
    const list = s.ids.map((id) => p.notes.find((n) => n.id === id));
    if (list.some((n) => !n || n.state !== 'placed' || !drawn(n.id))) return;
    settling.current = null;
    // under the card, the column starts below the card as it is drawn now (its suggestion list may have gone)
    const cap = p.captures.find((c) => c.id === s.capture);
    let y = s.below && cap ? Math.round(cardBottom(cap)) : s.y;
    for (const n of list as Note[]) {
      if (Math.abs(n.y - y) > 2) p.onMoveNote(n, { x: n.x, y });
      y += (drawn(n.id)?.offsetHeight ?? estimate(n.text)) + 12;
    }
  }, [p.notes]);

  // A note from the chat goes in the middle of the screen, below any note already there.
  const noteSpot = (): Point => {
    const c = canvas.current;
    const v = viewRef.current;
    const at = toWorld(v, { x: (c?.clientWidth ?? 800) / 2, y: 64 });
    const x = Math.round(at.x - NOTE_W / 2);
    let y = Math.round(at.y);
    for (let i = 0; i < 40; i += 1) {
      const hit = placed.find(
        (n) =>
          Math.abs(n.x - x) < NOTE_W &&
          y >= n.y - 8 &&
          y < n.y + (drawn(n.id)?.offsetHeight ?? estimate(n.text)) + 12,
      );
      if (!hit) break;
      y = Math.round(hit.y + (drawn(hit.id)?.offsetHeight ?? estimate(hit.text)) + 12);
    }
    return { x, y };
  };

  useEffect(() => {
    const pick = p.pick;
    if (!pick || picked.current === pick.key) return;
    picked.current = pick.key;
    const at = noteSpot();
    p.onChatNote(pick, at);
    bringIntoView({ x: at.x, y: at.y, w: NOTE_W, h: estimate(pick.text) });
  }, [p.pick]);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = imageFrom(e.clipboardData);
      if (!file) return;
      e.preventDefault();
      latest.current.onImage(file, freeSpot());
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  // A new capture is brought into view once.
  useEffect(() => {
    const r = p.reveal;
    if (!r || revealed.current === r.key) return;
    revealed.current = r.key;
    bringIntoView(r);
  }, [p.reveal]);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const onWheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement)?.closest?.('.suggest-list')) return;
      e.preventDefault();
      const v = viewRef.current;
      let next: View;
      if (e.ctrlKey || e.metaKey) {
        const factor = Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0018));
        next = zoomAt(v, local(e), factor);
      } else {
        const k = e.deltaMode === 1 ? 16 : 1;
        const sideways = e.shiftKey && !e.deltaX;
        next = {
          ...v,
          x: v.x - (sideways ? e.deltaY : e.deltaX) * k,
          y: v.y - (sideways ? 0 : e.deltaY) * k,
        };
      }
      setView(next);
      clearTimeout(settle.current);
      settle.current = setTimeout(() => latest.current.onView(viewRef.current), 250);
    };
    c.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      c.removeEventListener('wheel', onWheel);
      clearTimeout(settle.current);
    };
  }, []);

  // Space held over the board turns any drag into moving the view; a space typed in a text box stays typing.
  useEffect(() => {
    const down = (e: globalThis.KeyboardEvent) => {
      if (e.code !== 'Space' || e.isComposing || e.keyCode === 229) return;
      if (typing(e.target) || (e.target as HTMLElement)?.closest?.('button')) return;
      if (!over.current && !board.current?.contains(e.target as Node)) return;
      e.preventDefault();
      setSpace(true);
    };
    const up = (e: globalThis.KeyboardEvent) => {
      if (e.code === 'Space') setSpace(false);
    };
    const lost = () => setSpace(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', lost);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', lost);
    };
  }, []);

  const itemAt = (target: HTMLElement) => {
    const el = target.closest<HTMLElement>('[data-kind]');
    if (!el) return null;
    const id = el.dataset.id ?? '';
    const kind = el.dataset.kind as Target;
    const origin =
      kind === 'note'
        ? p.notes.find((n) => n.id === id)
        : p.captures.find((c) => c.id === id);
    return origin ? { el, id, kind, origin: { x: origin.x, y: origin.y } } : null;
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, input, .suggest')) return;
    if (e.button === 1 || (e.button === 0 && (space || tool === 'hand'))) {
      e.preventDefault();
      gesture.current = { kind: 'pan', from: { x: e.clientX, y: e.clientY }, view: viewRef.current };
      setPanning(true);
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }
    if (e.button !== 0) return;
    const item = itemAt(target);
    if (!item) return;
    e.preventDefault();
    item.el.focus({ preventScroll: true });
    setFront(item.id);
    gesture.current = {
      kind: 'move',
      target: item.kind,
      id: item.id,
      from: { x: e.clientX, y: e.clientY },
      origin: item.origin,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g) return;
    const dx = e.clientX - g.from.x;
    const dy = e.clientY - g.from.y;
    if (g.kind === 'pan') {
      setView({ ...g.view, x: g.view.x + dx, y: g.view.y + dy });
      return;
    }
    if (!g.moved && Math.hypot(dx, dy) < 3) return;
    g.moved = true;
    const z = viewRef.current.z;
    setMoved({ target: g.target, id: g.id, at: { x: g.origin.x + dx / z, y: g.origin.y + dy / z } });
  };

  const onPointerUp = () => {
    const g = gesture.current;
    gesture.current = null;
    if (g?.kind === 'pan') {
      setPanning(false);
      latest.current.onView(viewRef.current);
    } else if (g?.kind === 'move' && g.moved && moved) {
      const at = { x: Math.round(moved.at.x), y: Math.round(moved.at.y) };
      if (g.target === 'note') {
        const note = p.notes.find((n) => n.id === g.id);
        if (note) p.onMoveNote(note, at);
      } else {
        const cap = p.captures.find((c) => c.id === g.id);
        if (cap) p.onMoveCapture(cap, at);
      }
    }
    setMoved(null);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (typing(e.target) || e.nativeEvent.isComposing) return;
    const el = e.target as HTMLElement;
    if (!el.dataset?.kind) return;
    const item = itemAt(el);
    if (!item) return;
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      if (item.kind === 'note') {
        const note = p.notes.find((n) => n.id === item.id);
        if (note) p.onDeleteNote(note);
      } else {
        const cap = p.captures.find((c) => c.id === item.id);
        if (cap) p.onDeleteCapture(cap);
      }
      canvas.current?.focus({ preventScroll: true });
      return;
    }
    const step = e.shiftKey ? 40 : 8;
    const by: Record<string, Point> = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
    };
    const d = by[e.key];
    if (!d) return;
    e.preventDefault();
    setFront(item.id);
    const at = { x: item.origin.x + d.x, y: item.origin.y + d.y };
    if (item.kind === 'note') {
      const note = p.notes.find((n) => n.id === item.id);
      if (note) p.onMoveNote(note, at);
    } else {
      const cap = p.captures.find((c) => c.id === item.id);
      if (cap) p.onMoveCapture(cap, at);
    }
  };

  const zoomBy = (factor: number) => {
    const c = canvas.current!;
    keepView(zoomAt(viewRef.current, { x: c.clientWidth / 2, y: c.clientHeight / 2 }, factor));
  };

  const carriesImage = (e: DragEvent) => Array.from(e.dataTransfer.types).includes('Files');
  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    const words = carriesNote(e.dataTransfer);
    if (!words && !carriesImage(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDropping(words ? 'words' : 'image');
  };
  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    const to = e.relatedTarget as Node | null;
    if (!to || !board.current?.contains(to)) setDropping(null);
  };
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    if (carriesNote(e.dataTransfer)) {
      e.preventDefault();
      setDropping(null);
      const pick = readDrop(e.dataTransfer);
      if (!pick) return;
      const at = toWorld(viewRef.current, local(e));
      p.onChatNote(pick, { x: Math.round(at.x - NOTE_W / 2), y: Math.round(at.y - 24) });
      return;
    }
    if (!carriesImage(e)) return;
    e.preventDefault();
    setDropping(null);
    const file = imageFrom(e.dataTransfer);
    if (!file) return;
    const at = toWorld(viewRef.current, local(e));
    p.onImage(file, { x: Math.round(at.x - TILE_W / 2), y: Math.round(at.y - 40) });
  };

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) p.onImage(file, freeSpot());
  };

  let dot = 24 * view.z;
  while (dot < 12) dot *= 2;
  const grid = { '--dot': `${dot}px`, '--px': `${view.x}px`, '--py': `${view.y}px` } as CSSProperties;

  const posOf = (target: Target, id: string, at: Point) =>
    moved?.target === target && moved.id === id ? moved.at : at;
  const layer = new Map(
    [...p.notes].sort((a, b) => a.updatedAt.localeCompare(b.updatedAt)).map((n, i) => [n.id, i + 2]),
  );
  const empty = p.captures.length === 0 && placed.length === 0 && p.uploading.length === 0;

  return (
    <div
      className="board"
      ref={board}
      onDragEnter={onDragOver}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div
        ref={canvas}
        className={`canvas tool-${tool}${space ? ' space' : ''}${panning ? ' panning' : ''}`}
        style={grid}
        tabIndex={0}
        role="region"
        aria-label="필기 보드. 캡쳐를 붙여 넣으면 AI가 필기를 제안해요. 스페이스를 누른 채 끌면 화면이 움직이고, Ctrl과 휠로 확대해요"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerEnter={() => (over.current = true)}
        onPointerLeave={() => (over.current = false)}
        onKeyDown={onKeyDown}
      >
        <div className="world" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})` }}>
          {p.uploading.map((u) => (
            <div key={u.key} className="cap uploading" style={{ left: u.x, top: u.y, width: TILE_W }}>
              <div className="cap-img" style={{ height: tileHeight(u) }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u.url} alt="올리는 중인 캡쳐" draggable={false} />
              </div>
              <p className="cap-status" role="status">
                <i className="spin" aria-hidden />
                캡쳐를 올리는 중…
              </p>
            </div>
          ))}
          {p.captures.map((c) => {
            const at = posOf('capture', c.id, c);
            const suggested = p.notes
              .filter((n) => n.captureId === c.id && n.state === 'suggested')
              .sort((a, b) => a.ord - b.ord);
            const placedHere = placed.filter((n) => n.captureId === c.id).length;
            return (
              <div
                key={c.id}
                data-id={c.id}
                data-kind="capture"
                className={`cap${moved?.id === c.id ? ' moving' : ''}${p.flash === c.id ? ' flash' : ''}`}
                style={{ left: at.x, top: at.y, width: TILE_W, zIndex: front === c.id ? 9000 : 1 }}
                tabIndex={0}
                role="group"
                aria-label="올린 캡쳐"
              >
                <div className="cap-img" style={{ height: tileHeight(c) }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.localImages[c.id] ?? imageUrl(c.id)} alt="올린 캡쳐" draggable={false} />
                </div>
                <CaptureStatus
                  capture={c}
                  suggested={suggested.length}
                  placed={placedHere}
                  onRetry={() => p.onRetry(c)}
                />
                <button
                  className="sticky-del"
                  aria-label="캡쳐 지우기"
                  title="캡쳐 지우기 (Delete)"
                  onClick={() => p.onDeleteCapture(c)}
                >
                  <Close />
                </button>
                {suggested.length > 0 && (
                  <section className="suggest" aria-label="AI 필기 제안">
                    <header className="suggest-head">
                      <span>골라서 보드에 넣으세요</span>
                      <button className="btn small" onClick={() => place(c, suggested)}>
                        모두 넣기
                      </button>
                    </header>
                    <ul className="suggest-list">
                      {suggested.map((n) => {
                        const low = n.confidence !== null && n.confidence < LOW_CONFIDENCE;
                        return (
                          <li key={n.id} className={`sug${low ? ' low' : ''}`} data-note={n.id}>
                            <div className="sug-meta">
                              <span className="kind">{KIND_LABEL[n.kind]}</span>
                              {low && <span className="unsure">확인해 보세요</span>}
                            </div>
                            <p className="sug-text">{n.text}</p>
                            <div className="sug-actions">
                              <button className="btn small" onClick={() => place(c, [n])}>
                                넣기
                              </button>
                              <button
                                className="icon-btn ghost"
                                aria-label="이 제안 빼기"
                                title="빼기"
                                onClick={() => p.onDismiss(n)}
                              >
                                <Close />
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                )}
              </div>
            );
          })}
          {placed.map((n) => {
            const at = posOf('note', n.id, n);
            return (
              <div
                key={n.id}
                data-id={n.id}
                data-kind="note"
                className={`sticky${moved?.id === n.id ? ' moving' : ''}${p.flash === n.id ? ' flash' : ''}`}
                style={{ left: at.x, top: at.y, zIndex: front === n.id ? 9001 : layer.get(n.id) }}
                tabIndex={0}
                role="group"
                aria-label={`필기, ${n.source === 'capture-vision' ? '캡쳐에서' : `Q${n.questionNo ?? ''} 답에서`}`}
              >
                <p className="sticky-text">{n.text}</p>
                <span className="sticky-src">
                  {n.source === 'capture-vision'
                    ? `${KIND_LABEL[n.kind]} · 캡쳐에서`
                    : `Q${n.questionNo ?? '?'} 답에서`}{' '}
                  · {timeLabel(n.createdAt)}
                </span>
                <button
                  className="sticky-del"
                  aria-label="필기 지우기"
                  title="지우기 (Delete)"
                  onClick={() => p.onDeleteNote(n)}
                >
                  <Close />
                </button>
              </div>
            );
          })}
        </div>
      </div>
      {empty && !p.intro && (
        <div className="board-empty">
          <Page size={24} />
          <b>아직 필기가 없어요</b>
          <p className="only-wide">
            AI와 대화하다 남기고 싶은 화면을 캡쳐해(Win+Shift+S) 여기에 붙여 넣으세요(Ctrl+V). 필기는
            자동으로 만들어 드려요.
          </p>
          <p className="only-narrow">
            아래 그림 버튼으로 캡쳐나 사진을 올리세요. 필기는 자동으로 만들어 드려요.
          </p>
        </div>
      )}
      {p.intro && <Intro onClose={p.onCloseIntro} />}
      <div className="toolbar" role="toolbar" aria-label="보드 도구">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            className="tool"
            aria-label={t.label}
            title={t.label}
            aria-pressed={tool === t.id}
            onClick={() => setTool(t.id)}
          >
            {t.icon}
          </button>
        ))}
        <span className="tool-sep" aria-hidden />
        <button
          className="tool"
          aria-label="캡쳐 올리기"
          title="캡쳐 올리기 (붙여넣기 Ctrl+V도 돼요)"
          onClick={() => fileInput.current?.click()}
        >
          <Picture size={20} />
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          onChange={onPick}
          data-testid="capture-input"
        />
      </div>
      <div className="zoom" role="group" aria-label="확대와 축소">
        <button className="icon-btn ghost" aria-label="축소" onClick={() => zoomBy(1 / 1.25)}>
          <Minus />
        </button>
        <button
          className="zoom-pct"
          aria-label={`지금 ${Math.round(view.z * 100)}%. 누르면 100%로 맞춰요`}
          onClick={() => zoomBy(1 / viewRef.current.z)}
        >
          {Math.round(view.z * 100)}%
        </button>
        <button className="icon-btn ghost" aria-label="확대" onClick={() => zoomBy(1.25)}>
          <Plus />
        </button>
      </div>
      <p className="hint" aria-hidden>
        Ctrl+V로 캡쳐 붙이기 · 스페이스+끌기로 이동
      </p>
      {dropping && (
        <>
          <div className="dropzone" aria-hidden />
          <p className="droptag" style={{ left: 16, top: 16 }} aria-hidden>
            {dropping === 'words' ? <Page /> : <Picture />}
            <b>
              {dropping === 'words'
                ? '여기에 놓으면 고른 글이 그대로 필기가 돼요'
                : '놓으면 AI가 이 캡쳐로 필기를 만들어요'}
            </b>
          </p>
        </>
      )}
    </div>
  );
}
