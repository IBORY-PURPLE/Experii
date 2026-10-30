import { useEffect, type ReactNode } from 'react';
import type {
  DoneNode,
  LockedNode,
  Roadmap as RoadmapData,
} from '../shared/ipc';
import { rateChip, rateLabel } from './format';
import { Check, Dots, Lock } from './icons';

type Props = {
  roadmap: RoadmapData;
  activeConversationId: string | null;
  makingConversationId: string | null;
  openCardId: string | null;
  openLockedId: string | null;
  cardView: ReactNode;
  lockedBubble: ReactNode;
  onOpenConversation(id: string): void;
  onOpenCard(node: DoneNode): void;
  onOpenLocked(node: LockedNode): void;
};

export function LockedBubble(p: { node: LockedNode; onStart(): void }) {
  return (
    <div
      className="bubble"
      id={`bubble-${p.node.id}`}
      role="group"
      aria-label="GPT가 추천한 다음 공부"
    >
      <b>{p.node.title}</b>
      <small>GPT가 추천한 다음 공부</small>
      <p>{p.node.reason}</p>
      <button className="btn small" onClick={p.onStart}>
        이걸로 시작
      </button>
    </div>
  );
}

export function Roadmap(p: Props) {
  const { stats, subject, nodes } = p.roadmap;
  const pct = stats.rated ? Math.round((stats.useful / stats.rated) * 100) : 0;
  const focused = p.openCardId ?? p.openLockedId;

  useEffect(() => {
    if (focused)
      document.getElementById(`node-${focused}`)?.scrollIntoView({
        block: focused === p.openCardId ? 'start' : 'nearest',
      });
  }, [focused, p.openCardId]);

  return (
    <>
      <header className="statbar">
        <div className="stats">
          <div className="subject-title">
            <small>과목</small>
            <h1 className="band-title">{subject.title}</h1>
          </div>
          <div className="stat">
            <b className="band-title">{stats.cards}</b>
            <span>쌓인 경험</span>
          </div>
          <div className="stat">
            <b className="band-title">
              {stats.useful}/{stats.rated}
            </b>
            <span>쓸 만해요</span>
            <div
              className="bar"
              role="img"
              aria-label={`쓸 만해요 비율 ${pct}%`}
            >
              <i style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="stat">
            <b className="band-title">{stats.unrated}</b>
            <span>평가 전</span>
          </div>
        </div>
      </header>
      {nodes.length === 0 ? (
        <div className="path-empty">
          <div className="ghost-path" aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <div>
            <h2>오른쪽에서 첫 대화를 시작해 보세요</h2>
            <p>
              대화를 마치고 “경험으로 남기기”를 누르면 이 길에 경험 칸이 생겨요.
            </p>
          </div>
        </div>
      ) : (
        <ol className="path">
          {nodes.map((n) => {
            if (n.kind === 'done') {
              const open = n.cardId === p.openCardId;
              const making = n.conversationId === p.makingConversationId;
              return (
                <li
                  key={n.cardId}
                  className="node"
                  data-kind="done"
                  id={`node-${n.cardId}`}
                >
                  <button
                    className="knob"
                    onClick={() => p.onOpenCard(n)}
                    aria-label={`${n.title} 카드 ${open ? '접기' : '열기'}`}
                    aria-expanded={open}
                    aria-controls={open ? `card-${n.cardId}` : undefined}
                  >
                    <Check size={24} />
                  </button>
                  {open && p.cardView ? (
                    p.cardView
                  ) : (
                    <button
                      className="tile"
                      aria-current={n.conversationId === p.activeConversationId}
                      onClick={() => p.onOpenCard(n)}
                    >
                      <div className="tile-head">
                        <h2>{n.title}</h2>
                        {making ? (
                          <span className="chip making">
                            <i className="spin" aria-hidden />
                            다시 만드는 중
                          </span>
                        ) : (
                          <span className={`chip ${rateChip(n.useful)}`}>
                            {rateLabel(n.useful)}
                          </span>
                        )}
                      </div>
                      <p>{n.summary}</p>
                      <div className="line-box">
                        <small>면접 한 마디</small>
                        {n.interviewLine}
                      </div>
                    </button>
                  )}
                </li>
              );
            }
            if (n.kind === 'current') {
              const making = n.conversationId === p.makingConversationId;
              return (
                <li key={n.conversationId} className="node" data-kind="current">
                  {/* The tile beside it does the same, so the keyboard stops there only. */}
                  <button
                    className="knob current"
                    tabIndex={-1}
                    onClick={() => p.onOpenConversation(n.conversationId)}
                    aria-label={`${n.title} 대화 열기`}
                  >
                    <Dots size={24} />
                  </button>
                  <button
                    className="tile"
                    aria-current={n.conversationId === p.activeConversationId}
                    onClick={() => p.onOpenConversation(n.conversationId)}
                  >
                    <div className="tile-head">
                      <h2>{n.title}</h2>
                      {making ? (
                        <span className="chip making">
                          <i className="spin" aria-hidden />
                          카드 만드는 중
                        </span>
                      ) : (
                        <span className="chip current">진행 중</span>
                      )}
                    </div>
                    <p>
                      {n.turns}턴 대화 중 · 마치면 “경험으로 남기기”를 눌러
                      주세요
                    </p>
                  </button>
                </li>
              );
            }
            const open = n.id === p.openLockedId;
            return (
              <li
                key={n.id}
                className="node"
                data-kind="locked"
                id={`node-${n.id}`}
              >
                <button
                  className="knob locked"
                  tabIndex={-1}
                  onClick={() => p.onOpenLocked(n)}
                  aria-label={`${n.title} 추천 보기`}
                  aria-expanded={open}
                  aria-controls={open ? `bubble-${n.id}` : undefined}
                >
                  <Lock size={20} />
                </button>
                <div>
                  <button
                    className="tile locked"
                    aria-expanded={open}
                    aria-controls={open ? `bubble-${n.id}` : undefined}
                    onClick={() => p.onOpenLocked(n)}
                  >
                    <div className="tile-head">
                      <h2>{n.title}</h2>
                      <span className="chip">추천 · 잠김</span>
                    </div>
                  </button>
                  {open && p.lockedBubble}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
