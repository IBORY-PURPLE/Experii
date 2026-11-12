'use client';

import { useCallback, useEffect, useState, type DragEvent, type RefObject } from 'react';
import { Plus } from './icons';

// Words picked from one saved answer (source drag-from-chat), as on the desktop (apps/desktop/src/renderer/collect.tsx).
export type Pick = { pageId: string; seq: number; q: number; text: string };
export type Refusal = 'streaming' | 'span' | 'too_long';

// Only a drag carrying this type lights the board; while dragging, a page can read the types but not the data.
export const NOTE_TYPE = 'application/x-experii-note';
export const MAX_NOTE = 4000;

export const REFUSALS: Record<Refusal, string> = {
  streaming: '답이 끝나면 필기할 수 있어요',
  span: '한 답 안에서만 골라 주세요',
  too_long: '필기는 4,000자까지예요. 꼭 남길 부분만 골라 주세요',
};

const clean = (text: string) => text.replace(/\r\n?/g, '\n').trim();

// null: nothing to pick here (no words, or only the user's own question).
export function pickFrom(sel: Selection | null, root: HTMLElement, pageId: string): Pick | Refusal | null {
  if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
  const text = clean(sel.toString());
  if (!text) return null;
  const range = sel.getRangeAt(0);
  const node = range.commonAncestorContainer;
  const el = node instanceof Element ? node : node.parentElement;
  const answer = el?.closest<HTMLElement>('.msg-ai');
  if (!answer || !root.contains(answer)) {
    const touched = [...root.querySelectorAll('.msg-ai')].some((m) => range.intersectsNode(m));
    return touched ? 'span' : null;
  }
  const seq = Number(answer.dataset.seq);
  if (!answer.dataset.seq || !Number.isInteger(seq)) return 'streaming';
  if (text.length > MAX_NOTE) return 'too_long';
  return { pageId, seq, q: Number(answer.dataset.q) || 1, text };
}

let dragging: Pick | null = null;
export const draggedPick = () => dragging;

export function readDrop(data: DataTransfer | null): Pick | null {
  try {
    const p = JSON.parse(data?.getData(NOTE_TYPE) || 'null') as Pick | null;
    if (
      p &&
      typeof p.pageId === 'string' &&
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

export const carriesNote = (data: DataTransfer | null) => !!data && [...data.types].includes(NOTE_TYPE);

type Shown = { pick: Pick | Refusal; left: number; top: number };

// Picking words from an answer: drag them onto the board, or press the button that shows up beside them.
export function useCollect(o: {
  panel: RefObject<HTMLElement | null>;
  root: RefObject<HTMLElement | null>;
  pageId: string | null;
  onAdd?(pick: Pick): void;
  onRefuse?(why: Refusal): void;
}) {
  const { panel, root, pageId, onAdd, onRefuse } = o;
  const [shown, setShown] = useState<Shown | null>(null);
  const on = !!onAdd && !!pageId;

  const update = useCallback(() => {
    const box = root.current;
    const host = panel.current;
    const sel = getSelection();
    const pick = on && box && host ? pickFrom(sel, box, pageId!) : null;
    if (!pick || !sel || !box || !host) {
      setShown(null);
      return;
    }
    const rects = [...sel.getRangeAt(0).getClientRects()].filter((r) => r.width > 0 && r.height > 0);
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
    const left = Math.min(Math.max(first.left + first.width / 2 - 56, h.left + 12), h.right - 132);
    setShown({ pick, left: left - h.left, top: top - h.top });
  }, [on, pageId, panel, root]);

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
    const pick = pickFrom(getSelection(), box, pageId!);
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
      className="btn small addnote"
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
