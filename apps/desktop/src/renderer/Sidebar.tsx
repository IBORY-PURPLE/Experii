import type { DoneNode, Subject } from '../shared/ipc';
import { dayLabel, rateLabel } from './format';
import { Plus } from './icons';
import { Wordmark } from './Logo';

type Props = {
  subjects: Subject[];
  subjectId: string | null;
  experiences: DoneNode[];
  making: { conversationId: string; title: string } | null;
  openCardId: string | null;
  account: string;
  onSelect(id: string): void;
  onNewSubject(): void;
  onOpenCard(node: DoneNode): void;
  onSignOut(): void;
};

export function Sidebar(p: Props) {
  const current = p.subjects.find((s) => s.id === p.subjectId);
  const fresh =
    p.making &&
    !p.experiences.some((n) => n.conversationId === p.making?.conversationId)
      ? p.making
      : null;
  return (
    <aside className="sidebar">
      <div className="side-brand">
        <Wordmark className="band-title" />
      </div>
      <div className="side-scroll">
        <div className="side-head">
          과목
          <button
            className="icon-btn"
            onClick={p.onNewSubject}
            aria-label="과목 만들기"
          >
            <Plus />
          </button>
        </div>
        {p.subjects.length === 0 ? (
          <div className="side-empty">
            <p>아직 과목이 없어요</p>
            <button className="btn small" onClick={p.onNewSubject}>
              + 과목 만들기
            </button>
          </div>
        ) : (
          <div className="side-list">
            {p.subjects.map((s) => (
              <button
                key={s.id}
                className="subject"
                aria-current={s.id === p.subjectId}
                onClick={() => p.onSelect(s.id)}
              >
                <span className="name">{s.title}</span>
                <span className="count" aria-label={`경험 ${s.cardCount}개`}>
                  {s.cardCount}
                </span>
              </button>
            ))}
          </div>
        )}
        {current && (
          <>
            <div className="side-head exp-head">
              {current.title}에 쌓인 경험
            </div>
            {fresh || p.experiences.length > 0 ? (
              <div className="side-list">
                {fresh && (
                  <div className="exp loading" role="status">
                    <span className="t">{fresh.title}</span>
                    <span className="m">
                      <i className="spin" aria-hidden />
                      경험 카드를 만드는 중…
                    </span>
                  </div>
                )}
                {p.experiences.map((n) => (
                  <button
                    key={n.cardId}
                    className="exp"
                    aria-current={n.cardId === p.openCardId}
                    onClick={() => p.onOpenCard(n)}
                  >
                    <span className="t">{n.title}</span>
                    {n.conversationId === p.making?.conversationId ? (
                      <span className="m">
                        <i className="spin" aria-hidden />
                        카드를 다시 만드는 중…
                      </span>
                    ) : (
                      <span className="m">
                        {`${dayLabel(n.createdAt)} · ${rateLabel(n.useful)}`}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="side-empty">아직 경험 카드가 없어요</div>
            )}
          </>
        )}
      </div>
      <div className="account">
        <span className="avatar">나</span>
        <span className="who">
          <span className="name">{p.account}</span>
          <span className="state">로그인됨</span>
        </span>
        <button className="link" onClick={p.onSignOut}>
          로그아웃
        </button>
      </div>
    </aside>
  );
}
