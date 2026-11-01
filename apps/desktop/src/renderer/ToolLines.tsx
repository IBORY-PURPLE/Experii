import type { ToolCallView, ToolEvent } from '../shared/ipc';

export type ToolLine = {
  label: string;
  query: string;
  status: ToolEvent['status'];
  count?: number;
};
export type LiveToolLine = ToolLine & { callId: string };

export function toolLineText(t: ToolLine): string {
  const query = t.query.trim();
  const result =
    t.status === 'running'
      ? '찾는 중…'
      : t.status === 'error'
        ? '검색하지 못했어요'
        : `${t.count ?? 0}장`;
  return [t.label, ...(query ? [`'${query}'`] : []), result].join(' · ');
}

// A call's done or error event replaces its running line.
export function withToolEvent(
  lines: LiveToolLine[],
  ev: ToolEvent,
): LiveToolLine[] {
  const line: LiveToolLine = {
    callId: ev.callId,
    label: ev.label,
    query: ev.query,
    status: ev.status,
    count: ev.count,
  };
  return lines.some((l) => l.callId === ev.callId)
    ? lines.map((l) => (l.callId === ev.callId ? line : l))
    : [...lines, line];
}

// A saved call shows with the message after it: inside the answer it led to, or on its own before the next question.
export function savedLinesBefore(
  calls: ToolCallView[],
  index: number,
): ToolLine[] {
  return calls
    .filter((c) => c.afterMessage + 1 === index)
    .map((c) => ({
      label: c.label,
      query: c.query,
      status: c.count === null ? 'error' : 'done',
      count: c.count ?? undefined,
    }));
}

export function ToolLines(p: { lines: ToolLine[] }) {
  if (p.lines.length === 0) return null;
  return (
    <div className="tool-lines">
      {p.lines.map((t, i) => (
        <div key={i} className={`tool-line ${t.status}`} role="status">
          {t.status === 'running' ? (
            <i className="spin" aria-hidden />
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
              aria-hidden
            >
              <circle cx="11" cy="11" r="6.5" />
              <path d="M16 16l4 4" />
            </svg>
          )}
          <span>{toolLineText(t)}</span>
        </div>
      ))}
    </div>
  );
}
