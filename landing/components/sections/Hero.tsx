import { hero } from '@/content/landing';
import { ExampleBadge } from '@/components/ui/ExampleBadge';
import type { HeroVariant } from '@/lib/signup-schema';

export function Hero({ variant }: { variant: HeroVariant }) {
  const [line1, line2] = hero.headlines[variant];
  return (
    <section id="top" className="hero" aria-labelledby="hero-h">
      <div className="wrap">
        <p className="hero-kicker">{hero.kicker}</p>
        <h1 id="hero-h">
          <span>{line1}</span> <span>{line2}</span>
        </h1>
        <div className="hero-body">
          <div className="hero-copy">
            <p className="hero-sub">{hero.sub}</p>
            <div className="cta-row" id="hero-cta">
              <a className="btn btn-ink" href="#signup" data-cta="hero">
                {hero.ctaPrimary}
              </a>
              <a className="btn btn-soft" href="#how">
                {hero.ctaSecondary}
              </a>
            </div>
          </div>

          <figure className="interview" aria-label={hero.figureLabel}>
            <ExampleBadge label={hero.badge} />
            <div className="iv">
              <span className="who">{hero.interviewer}</span>
              <p className="bub bub-q">{hero.question}</p>
            </div>
            <div className="iv me">
              <span className="who">{hero.beforeLabel}</span>
              <p className="bub bub-before">{hero.before}</p>
            </div>
            <div className="iv me">
              <span className="who">{hero.afterLabel}</span>
              <p className="bub bub-after">{hero.after}</p>
              <p className="src-chip">{hero.source}</p>
            </div>
          </figure>

          <div className="mirror-wrap">
            <div className="mirror">
              <p className="mirror-text">
                <span className="mirror-line">
                  <span aria-hidden="true">{hero.mirror.text}</span>
                  <span className="mirror-cover" aria-hidden="true" />
                </span>
                <span className="sr-only">
                  {hero.mirror.srPrefix}
                  {hero.mirror.text}
                </span>
              </p>
              <a className="mirror-go" href="#how-join" data-topic="join" aria-label={hero.mirror.goLabel}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M9 14.5V3.5M9 3.5L4 8.5M9 3.5l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
            <ul className="mirror-chips" aria-label={hero.mirror.chipsLabel}>
              {hero.chips.map((c) => (
                <li key={c.topic}>
                  <a href={`#how-${c.topic}`} data-topic={c.topic}>
                    {c.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
