import { how } from '@/content/landing';
import { heroDemo, loopCopy, loopShared, loopTopics } from '@/content/loop';
import { LoopStepper } from '@/components/loop/LoopStepper';
import type { HeroVariant } from '@/lib/signup-fields';

export function HowItWorks({ variant }: { variant: HeroVariant }) {
  return (
    <section id="how" className="sec how" aria-labelledby="how-h">
      <div className="wrap">
        <div className="sec-head">
          <h2 id="how-h" className="h2">
            {how.title}
          </h2>
          <p className="lead">{how.lead}</p>
        </div>
        <LoopStepper
          topics={loopTopics}
          shared={loopShared}
          copy={loopCopy}
          variant={variant}
          cardsBefore={heroDemo.recent.length}
        />
        <div className="how-after">
          <p className="how-caption">{how.caption}</p>
          <p className="how-close">{how.close}</p>
          <a className="how-link" href="#signup" data-cta="how">
            {how.startLink}
          </a>
        </div>
        <div className="beats">
          <div className="beats-head">
            <span className="soon">{how.beats.badge}</span>
            <span>{how.beats.fact}</span>
          </div>
          <ol aria-label={how.beats.label}>
            {how.beats.items.map((b) => (
              <li key={b.when}>
                <span className="beat-date">{b.date}</span>
                <span className="beat-when">{b.when}</span>
                <span className="beat-what">{b.what}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
