import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';
import { ChevronLeft, ChevronRight, PanelLeft, PanelRight } from './icons';

export type Panel = 'sidebar' | 'chat';

const KEY = 'experii.layout.v1';
const LABEL: Record<Panel, string> = { sidebar: '사이드바', chat: '대화 패널' };
const SHORTCUT: Record<Panel, string> = {
  sidebar: 'Ctrl+B',
  chat: 'Ctrl+Shift+B',
};

const ids = (panel: Panel) => ({
  body: `${panel}-panel`,
  toggle: `${panel}-toggle`,
  handle: `${panel}-handle`,
});

function load(): Record<Panel, boolean> {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as {
      sidebar?: unknown;
      chat?: unknown;
    } | null;
    return { sidebar: saved?.sidebar !== false, chat: saved?.chat !== false };
  } catch {
    return { sidebar: true, chat: true };
  }
}

// Which side panels are open, kept across launches. While `active`, Ctrl+B folds the sidebar and Ctrl+Shift+B the chat.
export function useLayout(active: boolean) {
  const [layout, setLayout] = useState(load);
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(layout));
  }, [layout]);

  const setOpen = useCallback((panel: Panel, open: boolean) => {
    const { body, toggle, handle } = ids(panel);
    const focused = document.activeElement;
    const focusInside = !!document.getElementById(body)?.contains(focused);
    // A folded panel turns inert, so focus moves to the handle that brings it back, and back again on unfolding.
    flushSync(() =>
      setLayout((l) => (l[panel] === open ? l : { ...l, [panel]: open })),
    );
    if (!open && focusInside) document.getElementById(handle)?.focus();
    if (open && focused?.id === handle)
      document.getElementById(toggle)?.focus();
  }, []);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (!e.ctrlKey || e.altKey || e.metaKey || e.code !== 'KeyB') return;
      // Korean IME: a key pressed while a syllable is being composed belongs to the IME.
      if (e.isComposing || e.keyCode === 229) return;
      e.preventDefault();
      if (e.repeat) return;
      const panel = e.shiftKey ? 'chat' : 'sidebar';
      setOpen(panel, !layoutRef.current[panel]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, setOpen]);

  return { layout, setOpen };
}

// A grid column that slides its panel out and leaves a thin handle at the window edge.
export function Pane(p: {
  panel: Panel;
  open: boolean;
  onOpen(): void;
  children: ReactNode;
}) {
  const { body, handle } = ids(p.panel);
  return (
    <div className={`pane ${p.panel}-pane`}>
      <div id={body} className="pane-body" inert={!p.open}>
        {p.children}
      </div>
      <button
        id={handle}
        className="pane-handle"
        hidden={p.open}
        aria-label={`${LABEL[p.panel]} 펴기`}
        title={`${LABEL[p.panel]} 펴기 (${SHORTCUT[p.panel]})`}
        aria-expanded={false}
        aria-controls={body}
        onClick={p.onOpen}
      >
        {p.panel === 'sidebar' ? <ChevronRight /> : <ChevronLeft />}
      </button>
    </div>
  );
}

export function PaneToggle(p: { panel: Panel; onFold(): void }) {
  const { body, toggle } = ids(p.panel);
  return (
    <button
      id={toggle}
      className="icon-btn ghost pane-toggle"
      aria-label={`${LABEL[p.panel]} 접기`}
      title={`${LABEL[p.panel]} 접기 (${SHORTCUT[p.panel]})`}
      aria-expanded
      aria-controls={body}
      onClick={p.onFold}
    >
      {p.panel === 'sidebar' ? <PanelLeft /> : <PanelRight />}
    </button>
  );
}
