import type { DoneNode, Subject } from '../shared/ipc';
import { SUBJECT_COLORS, dayLabel, rateLabel } from './format';
import { PaneToggle } from './Panes';

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
  onFold(): void;
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
      <div className="side-top">
        <div className="brand">Experii</div>
        <PaneToggle panel="sidebar" onFold={p.onFold} />
      </div>
      <div className="side-scroll">
        <div className="side-head">
          과목
          <button
            className="icon-btn"
            onClick={p.onNewSubject}
            aria-label="과목 만들기"
          >
            +
          </button>
        </div>
        {p.subjects.length === 0 && (
          <div className="side-empty">
            <p>아직 과목이 없어요</p>
            <button className="btn small" onClick={p.onNewSubject}>
              + 과목 만들기
            </button>
          </div>
        )}
        {p.subjects.map((s, i) => (
          <button
            key={s.id}
            className="subject"
            aria-current={s.id === p.subjectId}
            onClick={() => p.onSelect(s.id)}
          >
            <span
              className="dot"
              style={{ background: SUBJECT_COLORS[i % SUBJECT_COLORS.length] }}
            />
            <span className="name">{s.title}</span>
            <span className="count" aria-label={`경험 ${s.cardCount}개`}>
              {s.cardCount}
            </span>
          </button>
        ))}
        {current && (
          <>
            <div className="exp-head">{current.title}에 쌓인 경험</div>
            {fresh && (
              <div className="exp loading" role="status">
                <i className="spin" aria-hidden />
                <span>
                  <span className="t">{fresh.title}</span>
                  <span className="m">경험 카드를 만드는 중…</span>
                </span>
              </div>
            )}
            {p.experiences.length === 0 && !fresh && (
              <div className="legend">아직 경험 카드가 없어요</div>
            )}
            {p.experiences.map((n) => (
              <button
                key={n.cardId}
                className="exp"
                aria-current={n.cardId === p.openCardId}
                onClick={() => p.onOpenCard(n)}
              >
                {n.conversationId === p.making?.conversationId ? (
                  <i className="spin" aria-hidden />
                ) : (
                  <i
                    className={`rate-dot ${n.useful === true ? 'useful' : n.useful === false ? 'not' : ''}`}
                  />
                )}
                <span>
                  <span className="t">{n.title}</span>
                  <span className="m">
                    {n.conversationId === p.making?.conversationId
                      ? '카드를 다시 만드는 중…'
                      : `${dayLabel(n.createdAt)} · ${rateLabel(n.useful)}`}
                  </span>
                </span>
              </button>
            ))}
            {p.experiences.length > 0 && (
              <div className="legend">
                <span>
                  <i className="rate-dot useful" /> 쓸 만해요
                </span>
                <span>
                  <i className="rate-dot not" /> 아니에요
                </span>
                <span>
                  <i className="rate-dot" /> 평가 전
                </span>
              </div>
            )}
          </>
        )}
      </div>
      <div className="account">
        <span className="avatar">나</span>
        <span className="who">
          <b>{p.account}</b>
          <span>로그인됨</span>
        </span>
        <button className="link" onClick={p.onSignOut}>
          로그아웃
        </button>
      </div>
    </aside>
  );
}
