import { download, hero } from '@/content/landing';
import { DownloadButton } from '@/components/download/Download';
import { BoardDemo } from '@/components/hero/board-demo/BoardDemo';
import type { HeroVariant } from '@/lib/signup-fields';

export function Hero({ variant }: { variant: HeroVariant }) {
  const [line1, line2] = hero.headlines[variant];
  return (
    <section id="top" className="hero" aria-labelledby="hero-h">
      <div className="hero-card">
        <p className="hero-kicker">
          <b>{hero.brand}</b> · {hero.kicker}
        </p>
        <h1 id="hero-h">
          <span>{line1}</span> <span>{line2}</span>
        </h1>
        <p className="hero-sub">
          <span>{hero.sub[0]}</span> <span>{hero.sub[1]}</span>
        </p>
        <div className="cta-row" id="hero-cta">
          <DownloadButton copy={download} location="hero" />
          <a className="btn btn-soft" href="#signup" data-cta="hero">
            {hero.ctaSignup}
          </a>
        </div>
        <BoardDemo note={hero.demoNote} />
      </div>
    </section>
  );
}
