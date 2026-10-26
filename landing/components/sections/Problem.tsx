import { problem } from '@/content/landing';
import { RichText } from '@/lib/rich';

export function Problem() {
  return (
    <section id="problem" className="sec problem" aria-labelledby="pr-h">
      <div className="wrap">
        <div className="sec-head">
          <h2 id="pr-h" className="h2">
            {problem.title}
          </h2>
        </div>
        <div className="quotes">
          {problem.quotes.map((q) => (
            <blockquote key={q}>{q}</blockquote>
          ))}
        </div>
        <p className="q-src">{problem.source}</p>
        <div className="pr-low">
          <div className="memos" aria-hidden="true">
            <div className="memo-pile">
              {problem.memo.stamps.map((stamp) => (
                <div className="memo" key={stamp}>
                  <div className="memo-top">
                    <b>{problem.memo.title}</b>
                    <span>{stamp}</span>
                  </div>
                  <div className="memo-lines">
                    <i />
                    <i />
                    <i />
                  </div>
                  <div className="memo-re">
                    {problem.memo.reopened}
                    <i className="hd" />
                    <i className="hd" />
                    <i className="hd" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="pr-sum">
            {problem.summary.map((parts, i) => (
              <p key={i}>
                <RichText parts={parts} />
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
