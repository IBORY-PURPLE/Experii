import { REDACTION_LABELS, type StoredCard } from '../shared/card';
import { dayLabel } from './format';

type Props = {
  card: StoredCard;
  subjectTitle: string;
  regenerating: boolean;
  onRate(useful: boolean): void;
  onAsk(): void;
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
  const hidden = Object.entries(c.redactions).filter(([, n]) => n > 0);
  return (
    <article className="card-view" aria-label={`경험 카드: ${c.title}`}>
      <header className="cv-band">
        <span>
          경험 카드 · {p.subjectTitle} · {dayLabel(c.createdAt)}
        </span>
        <button className="cv-fold" onClick={p.onClose}>
          접기
        </button>
      </header>
      <div className="cv-body">
        <h3>{c.title}</h3>
        <p className="cv-summary">{c.summary}</p>
        {hidden.length > 0 && (
          <p className="cv-redacted" role="note">
            비밀로 보이는 문자열을 가렸어요:{' '}
            {hidden
              .map(([kind, n]) => `${REDACTION_LABELS[kind] ?? kind} ${n}개`)
              .join(', ')}
          </p>
        )}
        <div className="line-box">
          <small>면접 한 마디</small>
          {c.interview_line}
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
        {c.concepts.length > 0 && (
          <>
            <h4>배운 개념</h4>
            <ul className="concepts">
              {c.concepts.map((concept) => (
                <li key={concept}>{concept}</li>
              ))}
            </ul>
          </>
        )}
        <h4>다음 할 일</h4>
        <p className="cv-next">{c.next_steps}</p>
        <div className="rate">
          <p>이 카드, 면접에 쓸 만한가요?</p>
          <button
            className={`btn small ${c.useful === true ? 'yes' : ''}`}
            aria-pressed={c.useful === true}
            onClick={() => p.onRate(true)}
          >
            면접에 쓸 만해요
          </button>
          <button
            className={`btn small ${c.useful === false ? 'no' : ''}`}
            aria-pressed={c.useful === false}
            onClick={() => p.onRate(false)}
          >
            아니에요
          </button>
        </div>
      </div>
      <footer className="cv-foot">
        <span>지시문 {c.promptVersion}</span>
        <button className="btn small" onClick={p.onAsk}>
          이어서 묻기
        </button>
        <button
          className="btn small"
          onClick={p.onRegenerate}
          disabled={p.regenerating}
        >
          {p.regenerating ? '다시 만드는 중…' : '카드 다시 만들기'}
        </button>
      </footer>
    </article>
  );
}
