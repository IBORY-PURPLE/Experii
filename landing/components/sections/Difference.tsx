import { difference } from '@/content/landing';
import { ExampleBadge } from '@/components/ui/ExampleBadge';
import { RichText } from '@/lib/rich';

export function Difference() {
  const last = difference.cards.length - 1;
  return (
    <section id="difference" className="sec diff" aria-labelledby="df-h">
      <div className="wrap">
        <div className="sec-head">
          <h2 id="df-h" className="h2">
            {difference.title}
          </h2>
          <p className="lead">
            <RichText parts={difference.lead} />
          </p>
        </div>
        <figure className="tl">
          <div className="tl-grid" aria-hidden="true">
            <span className="ax ax-study">{difference.axis.study}</span>
            <span className="ax ax-apply">{difference.axis.apply}</span>
            <span className="ax ax-iv">{difference.axis.interview}</span>
            <span className="tl-name nm-ex">{difference.rows.experii}</span>
            <i className="r-study" />
            <i className="r-future" />
            <i className="r-dot rd1" />
            <i className="r-dot rd2" />
            <i className="r-dot rd3" />
            <i className="r-dot rd4" />
            <span className="tl-name nm-ot">{difference.rows.other}</span>
            <i className="r-ot" />
            <i className="gd gd-a" />
            <i className="gd gd-b" />
          </div>
          <figcaption className="sr-only">{difference.figcaption}</figcaption>
          <ol className="tl-cards">
            {difference.cards.map((c, i) => (
              <li key={c.when} className={i === last ? 'tc tc-now' : 'tc'}>
                <p className="tc-when">{c.when}</p>
                <p className="tc-meta">{c.meta}</p>
                <p className="tc-a">{c.answer}</p>
              </li>
            ))}
          </ol>
          <div className="tl-foot">
            <ExampleBadge label={difference.badge} />
            <span className="two">{difference.foot}</span>
          </div>
        </figure>
        <div className="diff-notes">
          {difference.notes.map((parts, i) => (
            <p key={i}>
              <RichText parts={parts} />
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
