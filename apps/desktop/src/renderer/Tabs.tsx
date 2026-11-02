import { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Close, Plus, Road } from './icons';

export type TabInfo = {
  id: string;
  title: string;
  notes: number;
  done: boolean;
  // "진행 중" while there is no card yet, else the day it was studied
  state: string;
};

type Props = {
  subjectTitle: string;
  tabs: TabInfo[];
  active: string | null;
  canBack: boolean;
  canForward: boolean;
  onBack(): void;
  onForward(): void;
  onRoadmap(): void;
  onOpen(id: string): void;
  onClose(id: string): void;
  onNew(): void;
};

// A page's knob from the path in miniature: filled once it is a card, a ring while it is in progress.
export const MiniKnob = (p: { done: boolean }) => (
  <span className={`mini-knob ${p.done ? 'done' : 'now'}`} aria-hidden />
);

// The browser-like head of the middle: back and forward, the subject's roadmap fixed first, then one tab per note page.
export function TabBar(p: Props) {
  const strip = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = strip.current;
    const tab = box?.querySelector<HTMLElement>('.tab.active');
    if (!box || !tab) return;
    const b = box.getBoundingClientRect();
    const t = tab.getBoundingClientRect();
    if (t.left < b.left) box.scrollLeft -= b.left - t.left;
    else if (t.right > b.right) box.scrollLeft += t.right - b.right;
  }, [p.active, p.tabs.length]);

  return (
    <div className="tabbar">
      <div className="tab-nav">
        <button
          className="icon-btn ghost"
          aria-label="뒤로"
          title="뒤로 (Alt+←)"
          disabled={!p.canBack}
          onClick={p.onBack}
        >
          <ArrowLeft />
        </button>
        <button
          className="icon-btn ghost"
          aria-label="앞으로"
          title="앞으로 (Alt+→)"
          disabled={!p.canForward}
          onClick={p.onForward}
        >
          <ArrowRight />
        </button>
      </div>
      <div className={`tab road${p.active === null ? ' active' : ''}`}>
        <button
          className="tab-main"
          aria-label={`${p.subjectTitle} 로드맵`}
          aria-current={p.active === null ? 'page' : undefined}
          onClick={p.onRoadmap}
        >
          <span className="tab-icon">
            <Road />
          </span>
          <span className="tab-title band-title">{p.subjectTitle}</span>
          <span className="tab-label">로드맵</span>
        </button>
      </div>
      {p.tabs.length > 0 && <span className="tab-sep" aria-hidden />}
      <div
        className="tabs"
        ref={strip}
        role="group"
        aria-label="열린 필기 페이지"
      >
        {p.tabs.map((t) => {
          const on = t.id === p.active;
          return (
            <div key={t.id} className={`tab page${on ? ' active' : ''}`}>
              <button
                className="tab-main"
                aria-label={`${t.title} 필기 페이지`}
                aria-current={on ? 'page' : undefined}
                title={t.title}
                onClick={() => p.onOpen(t.id)}
                onAuxClick={(e) => {
                  if (e.button === 1) p.onClose(t.id);
                }}
              >
                <span className="tab-icon">
                  <MiniKnob done={t.done} />
                </span>
                <span className="tab-title band-title">{t.title}</span>
                <span className="tab-label">
                  필기 {t.notes}개 · {t.state}
                </span>
              </button>
              <button
                className="tab-close"
                aria-label={`${t.title} 탭 닫기`}
                title="탭 닫기"
                onClick={() => p.onClose(t.id)}
              >
                <Close />
              </button>
            </div>
          );
        })}
      </div>
      <button
        className="icon-btn ghost tab-new"
        aria-label="새로운 대화 시작"
        title="새로운 대화 시작 (채팅 머리의 [새 대화]와 같아요)"
        onClick={p.onNew}
      >
        <Plus />
      </button>
    </div>
  );
}
