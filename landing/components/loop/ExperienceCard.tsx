import type { Ref } from 'react';
import type { CardCopy, LoopShared } from '@/content/loop';

export function ExperienceCard({
  card,
  shared,
  snippetVisible,
  snippetFresh,
  showPlan,
  showTags,
  showSource,
  isKey,
  fresh,
  snipRef,
}: {
  card: CardCopy;
  shared: LoopShared;
  snippetVisible: boolean;
  snippetFresh?: boolean;
  showPlan: boolean;
  showTags: boolean;
  showSource: boolean;
  isKey?: boolean;
  fresh?: boolean;
  snipRef?: Ref<HTMLElement>;
}) {
  const L = shared.cardLabels;
  const cls = ['xcard', isKey ? 'key' : '', fresh ? 'fresh' : ''].filter(Boolean).join(' ');
  const snipCls = ['xc-snip', snippetVisible ? '' : 'pending', snippetVisible && snippetFresh ? 'fresh' : '']
    .filter(Boolean)
    .join(' ');
  return (
    <article className={cls}>
      <p className="xc-head">{shared.cardHead}</p>
      <div className="xc-body">
        <span className="xc-k">{L.question}</span>
        <p className="xc-q">{card.question}</p>
        <span className="xc-k">
          {L.answer}
          <i className="pen" aria-hidden="true" />
        </span>
        <p className="xc-a">{card.answer}</p>
        <span className="xc-k">{L.lesson}</span>
        <p>{card.lesson}</p>
        <p className="xc-query">
          <span className="xc-k">{L.query}</span>
          <code className={snipCls} ref={snipRef} aria-hidden={snippetVisible ? undefined : true}>
            {card.snippet}
          </code>
          <i className="fold" aria-hidden="true" />
        </p>
        {showTags ? (
          <ul className="xc-tags">
            {card.tags.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        ) : null}
        {showSource ? <p className="xc-src">{shared.source}</p> : null}
        {showPlan ? (
          <p className="xc-re">
            <span className="xc-k">{L.plan}</span>
            {shared.revisitDates.map((d) => (
              <span key={d}>
                <i className="dot" aria-hidden="true" />
                {d}
              </span>
            ))}
          </p>
        ) : null}
      </div>
    </article>
  );
}
