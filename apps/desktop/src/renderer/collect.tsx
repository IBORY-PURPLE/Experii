import {
  useCallback,
  useEffect,
  useState,
  type DragEvent,
  type RefObject,
} from 'react';
import type { ChatMessage, Note } from '../shared/ipc';
import { Plus } from './icons';

// Words picked from one saved answer: where they came from and the words themselves.
export type Pick = {
  conversationId: string;
  seq: number;
  q: number;
  text: string;
};
export type Refusal = 'streaming' | 'span' | 'too_long';

// Only a drag that carries this type lights the drop zone; while dragging, a page can read the types but not the data.
export const NOTE_TYPE = 'application/x-experii-note';
export const MAX_NOTE = 4000;

export const REFUSALS: Record<Refusal, string> = {
  streaming: '답이 끝나면 필기할 수 있어요',
  span: '한 답 안에서만 골라 주세요',
  too_long: '필기는 4,000자까지예요. 꼭 남길 부분만 골라 주세요',
};

// An answer's question number is how many questions came before it; tool rounds can give one question two answers.
export function questionNumbers(messages: ChatMessage[]): number[] {
  let asked = 0;
  return messages.map((m) => (m.role === 'user' ? ++asked : asked));
}

const clean = (text: string) => text.replace(/\r\n?/g, '\n').trim();

// null: nothing to pick here (no words, or only the user's own question).
export function pickFrom(
  sel: Selection | null,
  root: HTMLElement,
  conversationId: string,
): Pick | Refusal | null {
  if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
  const text = clean(sel.toString());
  if (!text) return null;
  const range = sel.getRangeAt(0);
  const node = range.commonAncestorContainer;
  const el = node instanceof Element ? node : node.parentElement;
  const answer = el?.closest<HTMLElement>('.msg-ai');
  if (!answer || !root.contains(answer)) {
    const touched = [...root.querySelectorAll('.msg-ai')].some((m) =>
      range.intersectsNode(m),
    );
    return touched ? 'span' : null;
  }
  const seq = Number(answer.dataset.seq);
  if (!answer.dataset.seq || !Number.isInteger(seq)) return 'streaming';
  if (text.length > MAX_NOTE) return 'too_long';
  return { conversationId, seq, q: Number(answer.dataset.q) || 1, text };
}

// The pick in flight, for the drop zone's label: during a drag the data itself stays unreadable.
let dragging: Pick | null = null;
export const draggedPick = () => dragging;

export function readDrop(data: DataTransfer | null): Pick | null {
  try {
    const p = JSON.parse(data?.getData(NOTE_TYPE) || 'null') as Pick | null;
    if (
      p &&
      typeof p.conversationId === 'string' &&
      Number.isInteger(p.seq) &&
      Number.isInteger(p.q) &&
      typeof p.text === 'string' &&
      p.text
    )
      return p;
  } catch {
    // a malformed payload is not a note
  }
  return null;
}

export const carriesNote = (data: DataTransfer | null) =>
  !!data && [...data.types].includes(NOTE_TYPE);

// Where a note's words sit in an answer, matched without whitespace: a selection's text breaks lines where the DOM
// has none. Words not found (an answer rewritten since) just go unmarked.
export function findText(root: Element, text: string): Range | null {
  const want = text.replace(/\s+/g, '');
  if (!want) return null;
  const spots: Array<{ node: Text; at: number }> = [];
  let flat = '';
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    const node = n as Text;
    if (node.parentElement?.closest('.who, .tool-lines, .md-code-lang'))
      continue;
    for (let i = 0; i < node.data.length; i++) {
      if (/\s/.test(node.data[i])) continue;
      spots.push({ node, at: i });
      flat += node.data[i];
    }
  }
  const i = flat.indexOf(want);
  if (i < 0) return null;
  const end = spots[i + want.length - 1];
  const range = document.createRange();
  range.setStart(spots[i].node, spots[i].at);
  range.setEnd(end.node, end.at + 1);
  return range;
}

// The words already kept as notes are marked in the chat in grey, without touching the answer's DOM.
export function useNotedMarks(
  root: RefObject<HTMLElement | null>,
  notes: Note[] | undefined,
  drawn: unknown,
) {
  useEffect(() => {
    const box = root.current;
    if (!box || typeof Highlight === 'undefined' || !CSS.highlights) return;
    const ranges = (notes ?? []).flatMap((n) => {
      const answer =
        n.kind === 'excerpt'
          ? box.querySelector(`.msg-ai[data-seq="${n.sourceSeq}"]`)
          : null;
      const range = answer && findText(answer, n.text);
      return range ? [range] : [];
    });
    CSS.highlights.set('noted', new Highlight(...ranges));
    return () => {
      CSS.highlights.delete('noted');
    };
  }, [root, notes, drawn]);
}

type Shown = { pick: Pick | Refusal; left: number; top: number };

// Picking words from an answer: drag them to the middle, or press the button that shows up beside them.
export function useCollect(o: {
  panel: RefObject<HTMLElement | null>;
  root: RefObject<HTMLElement | null>;
  conversationId: string | null;
  onAdd?(pick: Pick): void;
  onRefuse?(why: Refusal): void;
}) {
  const { panel, root, conversationId, onAdd, onRefuse } = o;
  const [shown, setShown] = useState<Shown | null>(null);
  const on = !!onAdd && !!conversationId;

  const update = useCallback(() => {
    const box = root.current;
    const host = panel.current;
    const sel = getSelection();
    const pick = on && box && host ? pickFrom(sel, box, conversationId!) : null;
    if (!pick || !sel || !box || !host) {
      setShown(null);
      return;
    }
    const rects = [...sel.getRangeAt(0).getClientRects()].filter(
      (r) => r.width > 0 && r.height > 0,
    );
    if (!rects.length) {
      setShown(null);
      return;
    }
    // Above the first line, else below the last, never on the words, so any of them can still be grabbed.
    const h = host.getBoundingClientRect();
    const area = box.getBoundingClientRect();
    const first = rects.reduce((a, r) => (r.top < a.top ? r : a));
    const last = rects.reduce((a, r) => (r.bottom > a.bottom ? r : a));
    const above = first.top - 36;
    const top = above >= area.top + 4 ? above : last.bottom + 8;
    const left = Math.min(
      Math.max(first.left + first.width / 2 - 56, h.left + 12),
      h.right - 132,
    );
    setShown({ pick, left: left - h.left, top: top - h.top });
  }, [on, conversationId, panel, root]);

  useEffect(() => {
    if (!on) {
      setShown(null);
      return;
    }
    const box = root.current;
    const onUp = () => setTimeout(update, 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShown(null);
      else if (e.shiftKey) update();
    };
    const onChange = () => {
      const sel = getSelection();
      if (!sel || sel.isCollapsed) setShown(null);
    };
    const onScroll = () => setShown(null);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('keyup', onKey);
    document.addEventListener('selectionchange', onChange);
    box?.addEventListener('scroll', onScroll);
    return () => {
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('keyup', onKey);
      document.removeEventListener('selectionchange', onChange);
      box?.removeEventListener('scroll', onScroll);
    };
  }, [on, update, root]);

  const onDragStart = (e: DragEvent<HTMLElement>) => {
    const box = root.current;
    if (!on || !box) return;
    const pick = pickFrom(getSelection(), box, conversationId!);
    if (!pick) return;
    setShown(null);
    if (typeof pick === 'string') {
      e.preventDefault();
      onRefuse?.(pick);
      return;
    }
    dragging = pick;
    e.dataTransfer.setData('text/plain', pick.text);
    e.dataTransfer.setData(NOTE_TYPE, JSON.stringify(pick));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const onDragEnd = () => {
    dragging = null;
  };

  const add = () => {
    const pick = shown?.pick;
    setShown(null);
    if (!pick) return;
    if (typeof pick === 'string') {
      onRefuse?.(pick);
      return;
    }
    getSelection()?.removeAllRanges();
    onAdd?.(pick);
  };

  const button = shown && (
    <button
      className="addnote"
      style={{ left: shown.left, top: shown.top }}
      // keeps the selection alive until the click lands
      onMouseDown={(e) => e.preventDefault()}
      onClick={add}
    >
      <Plus />
      필기에 추가
    </button>
  );

  return { button, onDragStart, onDragEnd };
}
