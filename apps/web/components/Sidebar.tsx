'use client';

import type { PageSummary } from '@/lib/types';
import { Plus } from './icons';
import { Wordmark } from './Logo';
import { PaneToggle } from './Panes';

type Props = {
  pages: PageSummary[] | null;
  activeId: string | null;
  onSelect(id: string): void;
  onNew(): void;
  onFold(): void;
};

const dayLabel = (iso: string, now = new Date()) => {
  const d = new Date(iso);
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
};

export function Sidebar(p: Props) {
  return (
    <aside className="sidebar">
      <div className="side-brand">
        <Wordmark className="band-title" />
        <PaneToggle panel="sidebar" onFold={p.onFold} />
      </div>
      <div className="side-scroll">
        <div className="side-head">
          공부 페이지
          <button className="icon-btn" onClick={p.onNew} aria-label="새 공부 페이지">
            <Plus />
          </button>
        </div>
        {p.pages === null ? (
          <div className="side-empty">불러오는 중…</div>
        ) : p.pages.length === 0 ? (
          <div className="side-empty">
            <p>아직 공부 페이지가 없어요</p>
          </div>
        ) : (
          <div className="side-list">
            {p.pages.map((page) => (
              <button
                key={page.id}
                className="exp"
                aria-current={page.id === p.activeId}
                onClick={() => p.onSelect(page.id)}
              >
                <span className="t" title={page.title}>
                  {page.title}
                </span>
                <span className="m">{dayLabel(page.updatedAt)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="account">
        <span className="avatar">게</span>
        <span className="who">
          <span className="name">게스트</span>
          <span className="state">초대 링크로 들어왔어요</span>
        </span>
      </div>
    </aside>
  );
}
