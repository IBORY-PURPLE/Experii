import { how } from '@/content/landing';
import { heroDemo, loopCopy, loopShared, loopTopics } from '@/content/loop';
import { LoopStepper } from '@/components/loop/LoopStepper';
import type { HeroVariant } from '@/lib/signup-fields';

export function HowItWorks({ variant }: { variant: HeroVariant }) {
  return (
    <section id="how" className="sec how" aria-labelledby="how-h">
      <div className="wrap">
        <div className="sec-head" data-reveal="">
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
        <div className="how-after" data-reveal="">
          <p className="how-caption">{how.caption}</p>
          <p className="how-close">{how.close}</p>
          <a className="how-link" href="#signup" data-cta="how">
            {how.startLink}
          </a>
        </div>
      </div>
    </section>
  );
}
