import type { ReactNode } from 'react';
import type {
  DoneNode,
  LockedNode,
  Roadmap as RoadmapData,
} from '../shared/ipc';
import { rateLabel } from './format';
import { Check, Lock } from './icons';

type Props = {
  roadmap: RoadmapData;
  activeConversationId: string | null;
  openCardId: string | null;
  openLockedId: string | null;
  cardView: ReactNode;
  lockedBubble: ReactNode;
  onOpenConversation(id: string): void;
  onOpenCard(node: DoneNode): void;
  onOpenLocked(node: LockedNode): void;
};

export function Roadmap(p: Props) {
  const { stats, subject, nodes } = p.roadmap;
  const pct = stats.rated ? Math.round((stats.useful / stats.rated) * 100) : 0;
  return (
    <>
      <header className="statbar">
        <div className="subject-title">
          <small>과목</small>
          <b>{subject.title}</b>
        </div>
        <div className="stat">
          <b>{stats.cards}</b>
          <span>쌓인 경험</span>
        </div>
        <div className="stat">
          <b>
            {stats.useful}/{stats.rated}
          </b>
          <span>쓸 만해요</span>
          <div className="bar" aria-label={`쓸 만해요 비율 ${pct}%`}>
            <i style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="stat">
          <b>{stats.unrated}</b>
          <span>평가 전</span>
        </div>
      </header>
      {nodes.length === 0 ? (
        <div className="path-empty">
          <h2>오른쪽에서 첫 대화를 시작해 보세요</h2>
          <p>
            대화를 마치고 “경험으로 남기기”를 누르면 이 길에 경험 칸이 생겨요.
          </p>
        </div>
      ) : (
        <ol className="path">
          {nodes.map((n) => {
            if (n.kind === 'done') {
              const open = n.cardId === p.openCardId;
              return (
                <li key={n.cardId} className="node" id={`node-${n.cardId}`}>
                  <button
                    className="knob"
                    onClick={() => p.onOpenCard(n)}
                    aria-label={`${n.title} 카드 열기`}
                  >
                    <Check />
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
                        <h3>{n.title}</h3>
                        <span
                          className={`chip ${n.useful === true ? 'useful' : n.useful === null ? 'unrated' : ''}`}
                        >
                          {rateLabel(n.useful)}
                        </span>
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
              return (
                <li key={n.conversationId} className="node">
                  <button
                    className="knob current"
                    onClick={() => p.onOpenConversation(n.conversationId)}
                    aria-label={`${n.title} 대화 열기`}
                  >
                    …
                  </button>
                  <button
                    className="tile"
                    aria-current={n.conversationId === p.activeConversationId}
                    onClick={() => p.onOpenConversation(n.conversationId)}
                  >
                    <div className="tile-head">
                      <h3>{n.title}</h3>
                      <span className="chip current">진행 중</span>
                    </div>
                    <p>
                      {n.turns}턴 대화 중 · 마치면 “경험으로 남기기”를 눌러
                      주세요
                    </p>
                  </button>
                </li>
              );
            }
            return (
              <li key={n.id} className="node" id={`node-${n.id}`}>
                <button
                  className="knob locked"
                  onClick={() => p.onOpenLocked(n)}
                  aria-label={`${n.title} 추천 보기`}
                >
                  <Lock />
                </button>
                <div>
                  <button
                    className="tile locked"
                    aria-expanded={n.id === p.openLockedId}
                    onClick={() => p.onOpenLocked(n)}
                  >
                    <div className="tile-head">
                      <h3>{n.title}</h3>
                      <span className="chip">추천 · 잠김</span>
                    </div>
                  </button>
                  {n.id === p.openLockedId && p.lockedBubble}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
