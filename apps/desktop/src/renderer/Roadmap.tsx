import { useEffect, type ReactNode } from 'react';
import type {
  CardField,
  LockedNode,
  Roadmap as RoadmapData,
} from '../shared/ipc';
import { rateLabel } from './format';
import { Check, Lock, Page } from './icons';

type Props = {
  roadmap: RoadmapData;
  activeConversationId: string | null;
  makingConversationId: string | null;
  makingFields: Partial<Record<CardField, string>> | null;
  openLockedId: string | null;
  lockedBubble: ReactNode;
  onOpenPage(conversationId: string): void;
  onOpenLocked(node: LockedNode): void;
};

export function LockedBubble(p: { node: LockedNode; onStart(): void }) {
  return (
    <div className="bubble" role="group" aria-label="GPT가 추천한 다음 공부">
      <small>GPT가 추천한 다음 공부</small>
      <b>{p.node.title}</b>
      <p>{p.node.reason}</p>
      <button className="btn small primary" onClick={p.onStart}>
        이걸로 시작
      </button>
    </div>
  );
}

// Every node that is a conversation leads to its note page.
const PageLink = (p: { notes: number }) => (
  <div className="tile-foot">
    <span className="tile-notes">
      <Page />
      필기 {p.notes}개
    </span>
    <span className="tile-go">필기 페이지 →</span>
  </div>
);

export function Roadmap(p: Props) {
  const { stats, subject, nodes } = p.roadmap;
  const pct = stats.rated ? Math.round((stats.useful / stats.rated) * 100) : 0;

  useEffect(() => {
    if (p.openLockedId)
      document
        .getElementById(`node-${p.openLockedId}`)
        ?.scrollIntoView({ block: 'nearest' });
  }, [p.openLockedId]);

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
              const making = n.conversationId === p.makingConversationId;
              const fill = making ? p.makingFields : null;
              return (
                <li key={n.cardId} className="node" id={`node-${n.cardId}`}>
                  <button
                    className="knob"
                    onClick={() => p.onOpenPage(n.conversationId)}
                    aria-label={`${n.title} 필기 페이지 열기`}
                  >
                    <Check />
                  </button>
                  <button
                    className="tile"
                    aria-current={n.conversationId === p.activeConversationId}
                    onClick={() => p.onOpenPage(n.conversationId)}
                  >
                    <div className="tile-head">
                      <h3>{fill?.title ?? n.title}</h3>
                      {making ? (
                        <span className="chip making">
                          <i className="spin" aria-hidden />
                          다시 만드는 중
                        </span>
                      ) : (
                        <span
                          className={`chip ${n.useful === true ? 'useful' : n.useful === null ? 'unrated' : ''}`}
                        >
                          {rateLabel(n.useful)}
                        </span>
                      )}
                    </div>
                    <p>{fill?.summary ?? n.summary}</p>
                    <div className="line-box">
                      <small>면접 한 마디</small>
                      {fill?.interview_line ?? n.interviewLine}
                    </div>
                    <PageLink notes={n.notes} />
                  </button>
                </li>
              );
            }
            if (n.kind === 'current') {
              const making = n.conversationId === p.makingConversationId;
              const fill = making ? p.makingFields : null;
              return (
                <li key={n.conversationId} className="node">
                  <button
                    className="knob current"
                    onClick={() => p.onOpenPage(n.conversationId)}
                    aria-label={`${n.title} 필기 페이지 열기`}
                  >
                    …
                  </button>
                  <button
                    className="tile"
                    aria-current={n.conversationId === p.activeConversationId}
                    onClick={() => p.onOpenPage(n.conversationId)}
                  >
                    <div className="tile-head">
                      <h3>{fill?.title ?? n.title}</h3>
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
                      {fill?.summary ??
                        `${n.turns}턴 대화 중 · 마치면 “경험으로 남기기”를 눌러 주세요`}
                    </p>
                    {fill?.interview_line && (
                      <div className="line-box">
                        <small>면접 한 마디</small>
                        {fill.interview_line}
                      </div>
                    )}
                    <PageLink notes={n.notes} />
                  </button>
                </li>
              );
            }
            const open = n.id === p.openLockedId;
            return (
              <li key={n.id} className="node" id={`node-${n.id}`}>
                <button
                  className="knob locked"
                  onClick={() => p.onOpenLocked(n)}
                  aria-label={`${n.title} 추천 보기`}
                  aria-expanded={open}
                >
                  <Lock />
                </button>
                <div>
                  <button
                    className="tile locked"
                    aria-expanded={open}
                    onClick={() => p.onOpenLocked(n)}
                  >
                    <div className="tile-head">
                      <h3>{n.title}</h3>
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
