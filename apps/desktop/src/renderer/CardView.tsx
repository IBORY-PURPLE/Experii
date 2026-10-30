import { useId } from 'react';
import { REDACTION_LABELS, type StoredCard } from '../shared/card';
import { dayLabel, rateChip, rateLabel } from './format';
import { Check, Shield } from './icons';

type Props = {
  card: StoredCard;
  subjectTitle: string;
  regenerating: boolean;
  onRate(useful: boolean): void;
  onReopen(): void;
  onRegenerate(): void;
  onClose(): void;
};

const STAR = [
  ['situation', 'S', '상황'],
  ['task', 'T', '과제'],
  ['action', 'A', '행동'],
  ['result', 'R', '결과'],
] as const;

export function CardView(p: Props) {
  const c = p.card;
  const rateQuestion = useId();
  const hidden = Object.entries(c.redactions).filter(([, n]) => n > 0);
  return (
    <article className="card-view" aria-label={`경험 카드: ${c.title}`}>
      <header className="cv-head">
        <h3>{c.title}</h3>
        <span className={`chip ${rateChip(c.useful)}`}>
          {rateLabel(c.useful)}
        </span>
        <button className="btn ghost small cv-fold" onClick={p.onClose}>
          접기
        </button>
        <p className="cv-band">
          경험 카드 · {p.subjectTitle} · {dayLabel(c.createdAt)}
        </p>
        <p className="cv-summary">{c.summary}</p>
      </header>
      <div className="cv-body">
        {hidden.length > 0 && (
          <p className="cv-redacted" role="note">
            <Shield />
            <span>
              비밀로 보이는 문자열을 가렸어요:{' '}
              {hidden
                .map(([kind, n]) => `${REDACTION_LABELS[kind] ?? kind} ${n}개`)
                .join(', ')}
            </span>
          </p>
        )}
        <div className="line-box">
          <small>면접 한 마디</small>
          <p>{c.interview_line}</p>
        </div>
        <dl className="star">
          {STAR.map(([key, letter, label]) => {
            const value = c.star[key];
            return (
              <div key={key}>
                <dt>
                  <b>{letter}</b> {label}
                </dt>
                <dd className={value === null ? 'missing' : undefined}>
                  {value ?? '(대화에서 결과를 확인하지 못함)'}
                </dd>
              </div>
            );
          })}
        </dl>
        <dl className="cv-facts">
          {c.concepts.length > 0 && (
            <div>
              <dt>배운 개념</dt>
              <dd>
                <ul className="concepts">
                  {c.concepts.map((concept) => (
                    <li key={concept}>{concept}</li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
          <div>
            <dt>다음 할 일</dt>
            <dd className="cv-next">{c.next_steps}</dd>
          </div>
        </dl>
      </div>
      <div className="rate">
        <p id={rateQuestion}>이 카드, 면접에 쓸 만한가요?</p>
        <div
          className="cv-rate-actions"
          role="group"
          aria-labelledby={rateQuestion}
        >
          <button
            className="btn"
            aria-pressed={c.useful === true}
            onClick={() => p.onRate(true)}
          >
            {c.useful === true && <Check />}
            면접에 쓸 만해요
          </button>
          <button
            className="btn"
            aria-pressed={c.useful === false}
            onClick={() => p.onRate(false)}
          >
            {c.useful === false && <Check />}
            아니에요
          </button>
        </div>
      </div>
      <footer className="cv-foot">
        <span>지시문 {c.promptVersion}</span>
        <div className="cv-foot-actions">
          <button className="btn ghost" onClick={p.onReopen}>
            대화 다시 열기
          </button>
          <button
            className="btn ghost"
            onClick={p.onRegenerate}
            disabled={p.regenerating}
          >
            {p.regenerating && <i className="spin" aria-hidden />}
            {p.regenerating ? '다시 만드는 중…' : '카드 다시 만들기'}
          </button>
        </div>
      </footer>
    </article>
  );
}
