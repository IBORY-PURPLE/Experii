// The middle shows one place at a time: the subject's roadmap or one conversation's note page. A page's id is its
// conversation's id for now; when a page holds several conversations it keeps that id (flow-v2 5.3).
export type Place = { kind: 'roadmap' } | { kind: 'page'; id: string };

export type Pages = {
  tabs: string[];
  // most recently shown first, to pick the tab to close when there are too many
  seen: string[];
  history: Place[];
  at: number;
};

export type View = { x: number; y: number; z: number };

export const MAX_TABS = 8;
const MAX_HISTORY = 50;
const ROADMAP: Place = { kind: 'roadmap' };
export const DEFAULT_VIEW: View = { x: 0, y: 0, z: 1 };

export const samePlace = (a: Place, b: Place) =>
  a.kind === b.kind && (a.kind === 'roadmap' || a.id === (b as typeof a).id);

export function startPages(tabs: string[] = []): Pages {
  const open = [...new Set(tabs)].slice(0, MAX_TABS);
  return { tabs: open, seen: [...open], history: [ROADMAP], at: 0 };
}

export const activePlace = (s: Pages): Place => s.history[s.at] ?? ROADMAP;
export const canBack = (s: Pages) => s.at > 0;
export const canForward = (s: Pages) => s.at < s.history.length - 1;

// A new tab goes right after the one in front; past the limit the tab not seen for longest closes.
function withTab(s: Pages, id: string, after: Place): Pages {
  if (s.tabs.includes(id)) return s;
  const i = after.kind === 'page' ? s.tabs.indexOf(after.id) + 1 : 0;
  let tabs = [...s.tabs.slice(0, i), id, ...s.tabs.slice(i)];
  let seen = s.seen;
  if (tabs.length > MAX_TABS) {
    const stale = [...seen].reverse().find((t) => t !== id && tabs.includes(t));
    tabs = tabs.filter((t) => t !== stale);
    seen = seen.filter((t) => t !== stale);
  }
  return { ...s, tabs, seen };
}

function shown(s: Pages, place: Place): Pages {
  if (place.kind === 'roadmap') return s;
  return { ...s, seen: [place.id, ...s.seen.filter((t) => t !== place.id)] };
}

// Going somewhere new drops the forward history, as a browser does.
export function visit(s: Pages, place: Place): Pages {
  const current = activePlace(s);
  const opened = place.kind === 'page' ? withTab(s, place.id, current) : s;
  if (samePlace(current, place)) return shown(opened, place);
  const history = [...opened.history.slice(0, opened.at + 1), place].slice(
    -MAX_HISTORY,
  );
  return shown({ ...opened, history, at: history.length - 1 }, place);
}

// Back and forward reopen a page whose tab was closed in the meantime.
export function step(s: Pages, by: -1 | 1): Pages {
  const at = s.at + by;
  if (at < 0 || at >= s.history.length) return s;
  const place = s.history[at];
  const opened =
    place.kind === 'page' ? withTab(s, place.id, activePlace(s)) : s;
  return shown({ ...opened, at }, place);
}

// Closing the tab in front shows its right neighbour, else its left one, else the roadmap.
export function closeTab(s: Pages, id: string): Pages {
  const i = s.tabs.indexOf(id);
  if (i < 0) return s;
  const tabs = s.tabs.filter((t) => t !== id);
  const rest = { ...s, tabs, seen: s.seen.filter((t) => t !== id) };
  const current = activePlace(s);
  if (current.kind !== 'page' || current.id !== id) return rest;
  const next = tabs[i] ?? tabs[i - 1];
  return visit(rest, next ? { kind: 'page', id: next } : ROADMAP);
}

// Pages whose conversation is gone from the subject leave the tabs and the history.
export function keepOnly(s: Pages, alive: Set<string>): Pages {
  const ok = (p: Place) => p.kind === 'roadmap' || alive.has(p.id);
  if (s.tabs.every((t) => alive.has(t)) && s.history.every(ok)) return s;
  const before = s.history.slice(0, s.at + 1).filter(ok).length;
  const history = s.history.filter(ok);
  return {
    tabs: s.tabs.filter((t) => alive.has(t)),
    seen: s.seen.filter((t) => alive.has(t)),
    history: history.length ? history : [ROADMAP],
    at: Math.max(0, before - 1),
  };
}

// Open tabs per subject and where each page was looked at: this PC's view, so localStorage and not the database.
export type Saved = {
  tabs: Record<string, string[]>;
  views: Record<string, View>;
};

const KEY = 'experii.notes.v1';
const MAX_VIEWS = 200;

const isView = (v: unknown): v is View => {
  const o = v as Partial<View> | null;
  return (
    !!o &&
    [o.x, o.y, o.z].every((n) => typeof n === 'number' && Number.isFinite(n)) &&
    o.z! > 0
  );
};

export function readSaved(raw: string | null): Saved {
  const empty: Saved = { tabs: {}, views: {} };
  try {
    const data = JSON.parse(raw ?? 'null') as Partial<Saved> | null;
    if (!data || typeof data !== 'object') return empty;
    const tabs: Saved['tabs'] = {};
    for (const [subject, list] of Object.entries(data.tabs ?? {}))
      if (Array.isArray(list))
        tabs[subject] = list.filter((t) => typeof t === 'string');
    const views: Saved['views'] = {};
    for (const [id, v] of Object.entries(data.views ?? {}))
      if (isView(v)) views[id] = { x: v.x, y: v.y, z: v.z };
    return { tabs, views };
  } catch {
    return empty;
  }
}

export function loadSaved(): Saved {
  try {
    return readSaved(localStorage.getItem(KEY));
  } catch {
    return readSaved(null);
  }
}

export function storeSaved(saved: Saved) {
  const ids = Object.keys(saved.views);
  const views =
    ids.length > MAX_VIEWS
      ? Object.fromEntries(
          ids.slice(-MAX_VIEWS).map((id) => [id, saved.views[id]]),
        )
      : saved.views;
  try {
    localStorage.setItem(KEY, JSON.stringify({ tabs: saved.tabs, views }));
  } catch {
    // A full or blocked storage only costs the open tabs on the next launch.
  }
}
