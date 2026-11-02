import { hero } from '@/content/landing';
import { ExampleBadge } from '@/components/ui/ExampleBadge';

export function BeforeAfter() {
  return (
    <section className="ba">
      <div className="wrap">
        <figure className="interview" aria-label={hero.figureLabel} data-reveal="">
          <ExampleBadge label={hero.badge} />
          <div className="iv">
            <span className="who">{hero.interviewer}</span>
            <p className="bub bub-q">{hero.question}</p>
          </div>
          <div className="iv-pair">
            <div className="iv me">
              <span className="who">{hero.beforeLabel}</span>
              <p className="bub bub-before">{hero.before}</p>
            </div>
            <div className="iv me">
              <span className="who">{hero.afterLabel}</span>
              <p className="bub bub-after">{hero.after}</p>
              <p className="src-chip">{hero.source}</p>
            </div>
          </div>
        </figure>
      </div>
    </section>
  );
}
