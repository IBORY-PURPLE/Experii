import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import type { CardField, DoneNode, LockedNode, Note } from '../shared/ipc';
import { NOTE_W, columnSpot, toWorld, zoomAt, type Point } from './canvas';
import { carriesNote, draggedPick, readDrop, type Pick } from './collect';
import { rateLabel } from './format';
import {
  ArrowRight,
  ChevronDown,
  Close,
  Hand,
  Minus,
  Page,
  Plus,
  Pointer,
  Speech,
} from './icons';
import type { View } from './pages';
import { MiniKnob } from './Tabs';

export type PageInfo = {
  conversationId: string;
  title: string;
  subjectTitle: string;
  order: number;
  turns: number;
  card: DoneNode | null;
  // false for a new conversation whose first answer is not saved yet
  saved: boolean;
};

type Tool = 'select' | 'hand';
type Gesture =
  | { kind: 'pan'; from: Point; view: View }
  | { kind: 'move'; id: string; from: Point; origin: Point; moved: boolean };

type Props = {
  page: PageInfo;
  notes: Note[] | null;
  view: View;
  making: Partial<Record<CardField, string>> | null;
  fullCard: ReactNode;
  fresh: boolean;
  flash: string | null;
  // a note to bring into view once, by key
  reveal: { id: string; key: number } | null;
  pick: (Pick & { key: number }) | null;
  locked: LockedNode[];
  // what the next study panel says when there is nothing to start
  nothingNext: string;
  onView(v: View): void;
  onPlace(pick: Pick, at: Point): void;
  onElsewhere(pick: Pick): void;
  onMove(note: Note, at: Point): void;
  onDelete(note: Note): void;
  onSource(note: Note): void;
  onRate(useful: boolean): void;
  onExpand(): void;
  onStart(node: LockedNode): void;
  onConsult(): void;
};

// Only selecting and moving the view for now: notes written by the user are outside the PRD (ai.md 3.6, 22:55).
const TOOLS: Array<{ id: Tool; label: string; icon: ReactNode }> = [
  { id: 'select', label: '선택', icon: <Pointer /> },
  { id: 'hand', label: '손 (화면 이동)', icon: <Hand /> },
];

const typing = (t: EventTarget | null) =>
  t instanceof HTMLElement &&
  !!t.closest('input, textarea, select, [contenteditable="true"]');

const clip = (text: string, n: number) => {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > n ? `${flat.slice(0, n)}…` : flat;
};

// The draft carries the candidates and what was kept, since GPT reads the conversation but not where it was noted.
export function consultDraft(locked: LockedNode[], notes: Note[]): string {
  const lines = ['다음에 뭘 공부하면 좋을지 내 필기를 보고 같이 정해 줘.'];
  const picks = locked
    .slice(0, 2)
    .map((n, i) => `${'①②'[i]} ${n.title}`)
    .join(' ');
  if (picks) lines.push(`추천 후보: ${picks}`);
  const kept = [...notes]
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(-5)
    .map((n) => `“${clip(n.text, 60)}”`)
    .join(', ');
  if (kept) lines.push(`내가 필기한 부분: ${kept}`);
  return lines.join('\n');
}

export function timeLabel(at: number, now = Date.now()): string {
  const d = new Date(at);
  const time = d.toLocaleTimeString('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return d.toDateString() === new Date(now).toDateString()
    ? time
    : `${d.getMonth() + 1}월 ${d.getDate()}일 ${time}`;
}

// The card's summary, pinned to the top-left corner: the page's experience at a glance, rated without opening it.
function Pin(p: {
  page: PageInfo;
  notes: number;
  making: Props['making'];
  fullCard: ReactNode;
  fresh: boolean;
  onRate(useful: boolean): void;
  onExpand(): void;
}) {
  const { page, making } = p;
  const card = page.card;
  if (p.fullCard)
    return <section className="pin expanded">{p.fullCard}</section>;
  const chip = making ? (
    <span className="chip making">
      <i className="spin" aria-hidden />
      카드 만드는 중
    </span>
  ) : card ? (
    <span
      className={`chip ${card.useful === true ? 'useful' : card.useful === null ? 'unrated' : ''}`}
    >
      {rateLabel(card.useful)}
    </span>
  ) : (
    <span className="chip current">진행 중</span>
  );
  const summary = making?.summary ?? card?.summary;
  const line = making?.interview_line ?? card?.interviewLine;
  return (
    <section
      className={`pin${p.fresh ? ' fresh' : ''}`}
      aria-label="경험 카드 요약"
    >
      <header className="pin-head">
        <h2>{making?.title ?? card?.title ?? page.title}</h2>
        {chip}
        {card && !making && (
          <button
            className="pin-toggle"
            aria-label="카드 전체 보기"
            title="카드 전체 보기"
            aria-expanded={false}
            onClick={p.onExpand}
          >
            <ChevronDown />
          </button>
        )}
      </header>
      <p className="pin-meta">
        <MiniKnob done={!!card} />
        {page.subjectTitle} 길 {page.order}번째 칸 · 질문 {page.turns}개 ·{' '}
        <span className="pin-count">필기 {p.notes}개</span>
      </p>
      {summary || line ? (
        <div className="pin-body">
          {summary && <p className="pin-summary">{summary}</p>}
          {line && (
            <div>
              <p className="pin-label">면접 한 마디</p>
              <p className="pin-said">{line}</p>
            </div>
          )}
        </div>
      ) : (
        <p className="pin-empty">
          {making
            ? '이 대화로 카드를 만드는 중이에요…'
            : '경험으로 남기면 이 대화로 카드를 만들어요'}
        </p>
      )}
      {card && !making && (
        <div className="pin-rate" role="group" aria-label="면접에 쓸 만한가요?">
          <p>면접에 쓸 만한가요?</p>
          <button
            className={`btn small${card.useful === true ? ' yes' : ''}`}
            aria-pressed={card.useful === true}
            onClick={() => p.onRate(true)}
          >
            쓸 만해요
          </button>
          <button
            className={`btn small${card.useful === false ? ' no' : ''}`}
            aria-pressed={card.useful === false}
            onClick={() => p.onRate(false)}
          >
            아니에요
          </button>
        </div>
      )}
    </section>
  );
}

function Next(p: {
  locked: LockedNode[];
  nothingNext: string;
  onClose(): void;
  onStart(node: LockedNode): void;
  onConsult(): void;
}) {
  return (
    <section className="next" aria-labelledby="next-title">
      <header className="next-head">
        <h2 id="next-title">다음 공부 정하기</h2>
        <button
          className="icon-ghost"
          aria-label="다음 공부 닫기"
          onClick={p.onClose}
        >
          <Close />
        </button>
      </header>
      {p.locked.length > 0 ? (
        <>
          <p className="next-lead">
            이 과목의 가장 최근 대화로 카드를 만들 때 GPT가 고른 다음 공부예요.
          </p>
          <ul className="recs">
            {p.locked.map((n) => (
              <li key={n.id} className="rec">
                <div className="rec-head">
                  <b>{n.title}</b>
                  <button className="btn small" onClick={() => p.onStart(n)}>
                    이걸로 시작
                  </button>
                </div>
                <p className="rec-why">
                  <span>근거 · </span>
                  {n.reason}
                </p>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="next-lead">{p.nothingNext}</p>
      )}
      <footer className="next-foot">
        <button className="btn small block" onClick={p.onConsult}>
          <Speech />
          GPT와 상의해서 정하기
        </button>
      </footer>
    </section>
  );
}

// One conversation's page: a dot-grid canvas the user pans and zooms, notes placed anywhere on it, the card pinned on top.
export function NotePage(p: Props) {
  const board = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const [view, setLiveView] = useState(p.view);
  const viewRef = useRef(view);
  const [tool, setTool] = useState<Tool>('select');
  const [space, setSpace] = useState(false);
  const [panning, setPanning] = useState(false);
  const [moved, setMoved] = useState<{ id: string; at: Point } | null>(null);
  const [front, setFront] = useState<string | null>(null);
  const [drop, setDrop] = useState<Point | null>(null);
  const [nextOpen, setNextOpen] = useState(false);
  const gesture = useRef<Gesture | null>(null);
  const over = useRef(false);
  const placed = useRef<number | null>(null);
  const revealed = useRef<number | null>(null);
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

  const notes = p.notes ?? [];
  const byId = (id: string) => notes.find((n) => n.id === id);
  const drawn = (id: string) =>
    board.current?.querySelector<HTMLElement>(`.sticky[data-id="${id}"]`);

  // Words kept without a spot of their own join their question's column, under what is there.
  useEffect(() => {
    const pick = p.pick;
    if (!pick || pick.conversationId !== p.page.conversationId) return;
    if (p.notes === null || placed.current === pick.key) return;
    placed.current = pick.key;
    p.onPlace(
      pick,
      columnSpot(
        pick.q,
        p.notes.map((n) => ({ ...n, h: drawn(n.id)?.offsetHeight ?? 140 })),
      ),
    );
  });

  // A note that just landed, or the one the same words already made, is brought into view and out from under the
  // pinned card; notes further away may slide out of view instead.
  useEffect(() => {
    const note = p.reveal ? byId(p.reveal.id) : undefined;
    const el = note && drawn(note.id);
    const c = canvas.current;
    if (!note || !el || !c || revealed.current === p.reveal!.key) return;
    revealed.current = p.reveal!.key;
    const v = viewRef.current;
    const l = note.x * v.z + v.x;
    const t = note.y * v.z + v.y;
    const w = el.offsetWidth * v.z;
    const h = el.offsetHeight * v.z;
    let dx =
      l < 16
        ? 16 - l
        : l + w > c.clientWidth - 16
          ? c.clientWidth - 16 - l - w
          : 0;
    const dy =
      t < 16
        ? 16 - t
        : t + h > c.clientHeight - 76
          ? c.clientHeight - 76 - t - h
          : 0;
    const pin = board.current?.querySelector('.pin')?.getBoundingClientRect();
    if (pin) {
      const at = c.getBoundingClientRect();
      const right = pin.right - at.left + 16;
      const under =
        l + dx < right &&
        t + dy < pin.bottom - at.top &&
        t + dy + h > pin.top - at.top;
      if (under) dx = right - l;
    }
    if (dx || dy) keepView({ ...v, x: v.x + dx, y: v.y + dy });
  }, [p.reveal, p.notes]);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const v = viewRef.current;
      let next: View;
      if (e.ctrlKey || e.metaKey) {
        const factor = Math.exp(
          -e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0018),
        );
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
      settle.current = setTimeout(
        () => latest.current.onView(viewRef.current),
        250,
      );
    };
    c.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      c.removeEventListener('wheel', onWheel);
      clearTimeout(settle.current);
    };
  }, []);

  // Space held over the page turns any drag into moving the view; typing a space in a text box stays typing.
  useEffect(() => {
    const down = (e: globalThis.KeyboardEvent) => {
      if (e.code !== 'Space' || e.isComposing || e.keyCode === 229) return;
      if (typing(e.target) || (e.target as HTMLElement)?.closest?.('button'))
        return;
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

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    const sticky = target.closest<HTMLElement>('.sticky');
    if (e.button === 1 || (e.button === 0 && (space || tool === 'hand'))) {
      e.preventDefault();
      gesture.current = {
        kind: 'pan',
        from: { x: e.clientX, y: e.clientY },
        view: viewRef.current,
      };
      setPanning(true);
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }
    if (e.button !== 0) return;
    const note = sticky && byId(sticky.dataset.id ?? '');
    if (!note || !sticky) return;
    e.preventDefault();
    sticky.focus({ preventScroll: true });
    setFront(note.id);
    gesture.current = {
      kind: 'move',
      id: note.id,
      from: { x: e.clientX, y: e.clientY },
      origin: { x: note.x, y: note.y },
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
    setMoved({
      id: g.id,
      at: { x: g.origin.x + dx / z, y: g.origin.y + dy / z },
    });
  };

  const onPointerUp = () => {
    const g = gesture.current;
    gesture.current = null;
    if (g?.kind === 'pan') {
      setPanning(false);
      latest.current.onView(viewRef.current);
    } else if (g?.kind === 'move' && g.moved && moved) {
      const note = byId(g.id);
      if (note)
        p.onMove(note, {
          x: Math.round(moved.at.x),
          y: Math.round(moved.at.y),
        });
    }
    setMoved(null);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (typing(e.target) || e.nativeEvent.isComposing) return;
    const sticky = (e.target as HTMLElement).closest<HTMLElement>('.sticky');
    const note = sticky && byId(sticky.dataset.id ?? '');
    if (!note || e.target !== sticky) return;
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      p.onDelete(note);
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
    setFront(note.id);
    p.onMove(note, { x: note.x + d.x, y: note.y + d.y });
  };

  const zoomBy = (factor: number) => {
    const c = canvas.current!;
    keepView(
      zoomAt(
        viewRef.current,
        { x: c.clientWidth / 2, y: c.clientHeight / 2 },
        factor,
      ),
    );
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (!carriesNote(e.dataTransfer)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    const r = board.current!.getBoundingClientRect();
    setDrop({ x: e.clientX - r.left, y: e.clientY - r.top });
  };
  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    const to = e.relatedTarget as Node | null;
    if (!to || !board.current?.contains(to)) setDrop(null);
  };
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    if (!carriesNote(e.dataTransfer)) return;
    e.preventDefault();
    setDrop(null);
    const pick = readDrop(e.dataTransfer);
    if (!pick) return;
    if (pick.conversationId !== p.page.conversationId) {
      p.onElsewhere(pick);
      return;
    }
    const at = toWorld(viewRef.current, local(e));
    p.onPlace(pick, {
      x: Math.round(at.x - NOTE_W / 2),
      y: Math.round(at.y - 24),
    });
  };

  // Reading order for the keyboard; for the eye, the note last picked up or moved sits on top.
  const order = [...notes].sort((a, b) => a.y - b.y || a.x - b.x);
  const layer = new Map(
    [...notes]
      .sort((a, b) => a.updatedAt - b.updatedAt)
      .map((n, i) => [n.id, i + 1]),
  );

  let dot = 24 * view.z;
  while (dot < 12) dot *= 2;
  const grid = {
    '--dot': `${dot}px`,
    '--px': `${view.x}px`,
    '--py': `${view.y}px`,
  } as CSSProperties;

  const picked = drop && draggedPick();
  const here = !picked || picked.conversationId === p.page.conversationId;
  const landing = drop && {
    left: drop.x - (NOTE_W / 2) * view.z,
    top: drop.y - 24 * view.z,
    width: NOTE_W * view.z,
    height: 96 * view.z,
  };

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
        aria-label="필기 캔버스. 스페이스를 누른 채 끌면 화면이 움직이고, Ctrl과 휠로 확대해요"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerEnter={() => (over.current = true)}
        onPointerLeave={() => (over.current = false)}
        onKeyDown={onKeyDown}
      >
        <div
          className="world"
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})`,
          }}
        >
          {order.map((n) => {
            const at = moved?.id === n.id ? moved.at : n;
            return (
              <div
                key={n.id}
                data-id={n.id}
                className={`sticky${moved?.id === n.id ? ' moving' : ''}${p.flash === n.id ? ' flash' : ''}`}
                style={{
                  left: at.x,
                  top: at.y,
                  width: n.w ?? undefined,
                  zIndex: front === n.id ? notes.length + 1 : layer.get(n.id),
                }}
                tabIndex={0}
                role="group"
                aria-label={`필기, Q${n.questionNo} 답에서`}
              >
                <p className="sticky-text">{n.text}</p>
                <button
                  className="sticky-src"
                  title="대화에서 이 답 보기"
                  onClick={() => p.onSource(n)}
                >
                  <Speech />Q{n.questionNo} · {timeLabel(n.createdAt)}
                </button>
                <button
                  className="sticky-del"
                  aria-label="필기 지우기"
                  title="지우기 (Delete)"
                  onClick={() => p.onDelete(n)}
                >
                  <Close />
                </button>
              </div>
            );
          })}
        </div>
      </div>
      {p.notes?.length === 0 && (
        <div className="board-empty">
          <Page />
          {p.page.saved ? (
            <>
              <b>아직 필기가 없어요</b>
              <p>
                GPT 답에서 남기고 싶은 부분을 골라 여기로 끌어 오세요. 글을
                고르면 [필기에 추가]도 떠요.
              </p>
            </>
          ) : (
            <>
              <b>첫 답을 받으면 여기에 필기할 수 있어요</b>
              <p>오른쪽에서 이 페이지의 첫 질문을 보내 주세요.</p>
            </>
          )}
        </div>
      )}
      <Pin
        page={p.page}
        notes={notes.length}
        making={p.making}
        fullCard={p.fullCard}
        fresh={p.fresh}
        onRate={p.onRate}
        onExpand={p.onExpand}
      />
      <div className="board-top">
        {nextOpen ? (
          <Next
            locked={p.locked}
            nothingNext={p.nothingNext}
            onClose={() => setNextOpen(false)}
            onStart={p.onStart}
            onConsult={p.onConsult}
          />
        ) : (
          <button
            className="btn small float"
            aria-expanded={false}
            onClick={() => setNextOpen(true)}
          >
            <ArrowRight />
            다음 공부 정하기
          </button>
        )}
      </div>
      <div className="toolbar" role="toolbar" aria-label="캔버스 도구">
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
      </div>
      <div className="zoom" role="group" aria-label="확대와 축소">
        <button
          className="icon-ghost"
          aria-label="축소"
          onClick={() => zoomBy(1 / 1.25)}
        >
          <Minus />
        </button>
        <button
          className="zoom-pct"
          aria-label={`지금 ${Math.round(view.z * 100)}%. 누르면 100%로 맞춰요`}
          onClick={() => zoomBy(1 / viewRef.current.z)}
        >
          {Math.round(view.z * 100)}%
        </button>
        <button
          className="icon-ghost"
          aria-label="확대"
          onClick={() => zoomBy(1.25)}
        >
          <Plus />
        </button>
      </div>
      <p className="hint" aria-hidden>
        스페이스+끌기로 이동 · Ctrl+휠로 확대
      </p>
      {drop && landing && (
        <>
          <div className="dropzone" aria-hidden />
          {here && <div className="landing" style={landing} aria-hidden />}
          <p
            className="droptag"
            style={{
              left: Math.max(8, here ? landing.left : drop.x + 16),
              top: here
                ? landing.top >= 48
                  ? landing.top - 40
                  : landing.top + landing.height + 8
                : drop.y + 16,
            }}
            aria-hidden
          >
            <Page />
            <b>
              {here
                ? '여기에 놓으면 필기가 돼요'
                : '놓으면 그 대화의 필기 페이지에 남아요'}
            </b>
            {here && picked && <span>Q{picked.q} 답에서</span>}
          </p>
        </>
      )}
    </div>
  );
}
