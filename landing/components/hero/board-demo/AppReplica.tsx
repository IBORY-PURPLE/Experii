import type { CSSProperties, ReactNode } from 'react';
import { BoardSlotParts, BodyParts, ChatParts, SideExp, WorldParts } from './AppParts';

// The desktop app's own markup (apps/desktop/src/renderer) at the moment ChatGPT has just been connected: the topic SQLD with no
// experience yet, the board with three notes kept on earlier days, an empty new conversation. It is the still the page shows without
// JS and the place the timeline starts from. The window is inert and hidden from assistive tech, so labels and titles are left out.
const OLD_NOTES = {
  third: { text: 'GROUP BY는 같은 값끼리 묶어 집계해요. SELECT에는 묶은 열이나 집계 함수만 올 수 있어요.', src: 'Q1 · 10월 31일 오후 8:40' },
  first: { text: 'INNER JOIN은 양쪽에 짝이 있는 행만 남겨요. 주문이 없는 서준은 빠져서 결과가 3행이에요.', src: 'Q2 · 11월 1일 오후 9:12' },
  card: { title: '회원 3명, 주문 3건', sum: '민지(1)는 주문 2건, 하린(3)은 1건이고 서준(2)은 주문이 없어요.', src: 'Q1 · 11월 1일 오후 9:05' },
};

// The board's view at the start (NotePage.tsx: translate, then scale; the dots follow).
const VIEW = { x: 0, y: 10, z: 0.9 };

function Svg({ size = 16, width = 2.25, children }: { size?: number; width?: number; children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

const SourceIcon = () => (
  <Svg>
    <path d="M4.5 5.5h15v10h-9l-4.5 3.5v-3.5h-1.5z" />
  </Svg>
);

function Sticky({ id, left, top, children }: { id: string; left: number; top: number; children: ReactNode }) {
  return (
    <div id={id} className="sticky x-oldnote" style={{ left, top, zIndex: 1 }}>
      {children}
    </div>
  );
}

function StickyCard({ id, left, top, children }: { id: string; left: number; top: number; children: ReactNode }) {
  return (
    <div id={id} className="sticky x-card is-note x-oldnote" style={{ left, top, zIndex: 1 }}>
      {children}
    </div>
  );
}

function Source({ children }: { children: ReactNode }) {
  return (
    <button className="sticky-src" tabIndex={-1}>
      <SourceIcon />
      {children}
    </button>
  );
}

export function AppReplica() {
  return (
    <div id="bd-win" className="bd-app bd-win">
      <header className="bd-titlebar">
        <svg className="bd-titlebar-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 3H4V13H13M4 8H11" />
        </svg>
        <span className="bd-titlebar-title">Experii</span>
        <span className="bd-titlebar-controls">
          <i>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor">
              <path d="M0 5.5H10" />
            </svg>
          </i>
          <i>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor">
              <rect x="0.5" y="0.5" width="9" height="9" rx="1" />
            </svg>
          </i>
          <i>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor">
              <path d="M0.5 0.5l9 9M9.5 0.5l-9 9" />
            </svg>
          </i>
        </span>
      </header>
      <div className="bd-body">
        <div className="app" data-sidebar="open" data-chat="open">
          <div className="pane sidebar-pane">
            <div className="pane-body">
              <aside className="sidebar">
                <div className="side-brand">
                  <span className="wordmark band-title">Experii</span>
                  <button className="icon-btn ghost pane-toggle" tabIndex={-1}>
                    <Svg>
                      <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
                      <path d="M9.5 4.5v15" />
                    </Svg>
                  </button>
                </div>
                <div className="side-scroll">
                  <div className="side-head">
                    학습 주제
                    <button className="icon-btn" tabIndex={-1}>
                      <Svg>
                        <path d="M12 5v14M5 12h14" />
                      </Svg>
                    </button>
                  </div>
                  <div className="side-list">
                    <button className="subject" aria-current="true" tabIndex={-1}>
                      <span className="name">SQLD</span>
                      <span id="bd-count" className="count">
                        0
                      </span>
                    </button>
                  </div>
                  <div className="side-head exp-head">SQLD에 쌓인 경험</div>
                  <div id="bd-exp" className="side-empty">
                    아직 경험 카드가 없어요
                  </div>
                  <SideExp />
                </div>
                <div className="account">
                  <span className="avatar">나</span>
                  <span className="who">
                    <span className="name">ChatGPT Plus</span>
                    <span className="state">로그인됨</span>
                  </span>
                  <button className="link" tabIndex={-1}>
                    로그아웃
                  </button>
                </div>
              </aside>
            </div>
          </div>
          <div className="middle">
            <div className="tabbar">
              <div className="tab-nav">
                <button className="icon-btn ghost" tabIndex={-1}>
                  <Svg>
                    <path d="M19 12H5M11 6l-6 6 6 6" />
                  </Svg>
                </button>
                <button className="icon-btn ghost" disabled tabIndex={-1}>
                  <Svg>
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </Svg>
                </button>
              </div>
              <div className="tabs" role="group">
                <div className="tab page active">
                  <button className="tab-main" aria-current="page" tabIndex={-1}>
                    <span className="tab-icon">
                      <Svg>
                        <path d="M6.5 3.5h7l4 4v13h-11z" />
                        <path d="M13.5 3.5v4h4M9.5 12.5h5M9.5 16h5" />
                      </Svg>
                    </span>
                    <span className="tab-title band-title">SQLD 보드</span>
                    <span id="bd-tab-count" className="tab-label">
                      필기 3개
                    </span>
                  </button>
                </div>
              </div>
              <button className="icon-btn ghost tab-new" tabIndex={-1}>
                <Svg>
                  <path d="M12 5v14M5 12h14" />
                </Svg>
              </button>
            </div>
            <div className="view">
              <div className="board">
                <div
                  id="bd-canvas"
                  className="canvas tool-select"
                  style={{ '--dot': `${24 * VIEW.z}px`, '--px': `${VIEW.x}px`, '--py': `${VIEW.y}px` } as CSSProperties}
                >
                  <div id="bd-world" className="world" style={{ transform: `translate(${VIEW.x}px, ${VIEW.y}px) scale(${VIEW.z})` }}>
                    <Sticky id="bd-old-3" left={430} top={10}>
                      <p className="sticky-text">{OLD_NOTES.third.text}</p>
                      <Source>{OLD_NOTES.third.src}</Source>
                    </Sticky>
                    <Sticky id="bd-old-1" left={600} top={176}>
                      <p className="sticky-text">{OLD_NOTES.first.text}</p>
                      <Source>{OLD_NOTES.first.src}</Source>
                    </Sticky>
                    <StickyCard id="bd-old-2" left={60} top={250}>
                      <b className="x-card-title">{OLD_NOTES.card.title}</b>
                      <p className="x-card-sum">{OLD_NOTES.card.sum}</p>
                      <Source>{OLD_NOTES.card.src}</Source>
                    </StickyCard>
                    <WorldParts />
                  </div>
                </div>
                <div className="board-top">
                  <button id="bd-organize" className="btn small float" aria-expanded="false" tabIndex={-1}>
                    정리하기
                  </button>
                </div>
                <div className="toolbar" role="toolbar">
                  <button className="tool" aria-pressed="true" tabIndex={-1}>
                    <Svg size={20} width={2.4}>
                      <path d="M6 3.5l12 7.2-5.3 1.4 3.1 5.6-2.5 1.4-3.1-5.6L6 17.6z" />
                    </Svg>
                  </button>
                  <button className="tool" aria-pressed="false" tabIndex={-1}>
                    <Svg size={20} width={2.4}>
                      <path d="M8 12V6.5a1.5 1.5 0 0 1 3 0V11m0-5.5V4.5a1.5 1.5 0 0 1 3 0V11m0-5a1.5 1.5 0 0 1 3 0v6.5a7 7 0 0 1-7 7h-.6a6 6 0 0 1-5-2.7L3.6 13a1.5 1.5 0 0 1 2.5-1.6L8 13.5" />
                    </Svg>
                  </button>
                </div>
                <div className="zoom" role="group">
                  <button className="icon-btn ghost" tabIndex={-1}>
                    <Svg>
                      <path d="M5 12h14" />
                    </Svg>
                  </button>
                  <button id="bd-zoom" className="zoom-pct" tabIndex={-1}>
                    {Math.round(VIEW.z * 100)}%
                  </button>
                  <button className="icon-btn ghost" tabIndex={-1}>
                    <Svg>
                      <path d="M12 5v14M5 12h14" />
                    </Svg>
                  </button>
                </div>
                <p className="hint">스페이스+끌기로 이동 · Ctrl+휠로 확대</p>
                <BoardSlotParts />
              </div>
            </div>
          </div>
          <div className="pane chat-pane">
            <div className="pane-body">
              <section className="chat">
                <header className="chat-head">
                  <div className="ttl">
                    <h2 id="bd-chat-title" className="band-title">
                      새 대화
                    </h2>
                    <p>SQLD · 대화</p>
                  </div>
                  <div className="actions">
                    <button className="btn small" tabIndex={-1}>
                      새 대화
                    </button>
                    <button className="btn small primary" tabIndex={-1}>
                      경험으로 남기기
                    </button>
                    <button className="icon-btn ghost pane-toggle" tabIndex={-1}>
                      <Svg>
                        <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
                        <path d="M14.5 4.5v15" />
                      </Svg>
                    </button>
                  </div>
                </header>
                <div id="bd-messages" className="messages">
                  <div className="day">새 대화</div>
                  <ChatParts />
                </div>
                <div className="composer">
                  <div id="bd-input" className="inputbox">
                    <textarea id="bd-textarea" placeholder="SQLD에 대해 물어보세요" readOnly tabIndex={-1} />
                    <button id="bd-send" className="icon-btn send" disabled tabIndex={-1}>
                      <Svg>
                        <path d="M12 19V5M6.5 10.5L12 5l5.5 5.5" />
                      </Svg>
                    </button>
                  </div>
                  <div className="plan-row">
                    <select className="model-select" disabled tabIndex={-1} defaultValue="">
                      <option value="">기본 모델</option>
                    </select>
                    <span className="plan">Using ChatGPT plan</span>
                    <button className="link" tabIndex={-1}>
                      Manage usage
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
        <BodyParts />
      </div>
    </div>
  );
}
