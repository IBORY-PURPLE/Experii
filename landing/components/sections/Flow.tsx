import { flow } from '@/content/landing';
import { RichText } from '@/lib/rich';

export function Flow() {
  return (
    <section id="flow" className="sec flow" aria-labelledby="flow-h">
      <div className="wrap flow-grid">
        <div className="flow-head">
          <div className="sec-head" data-reveal="">
            <h2 id="flow-h" className="h2">
              {flow.title}
            </h2>
            <p className="lead">{flow.lead}</p>
          </div>
        </div>
        <div className="flow-tl">
          <ol>
            {flow.steps.map((s) => (
              <li key={s.unit} className="flow-step" data-reveal="">
                <span className="flow-knot" aria-hidden="true" />
                <div>
                  <h3 className="flow-t">
                    <span className="flow-u">{s.unit}</span> · {s.title}
                  </h3>
                  <p>{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="flow-end" data-reveal="">
            <span className="flow-old">{flow.bridge.other}</span>{' '}
            <span className="flow-new">
              <RichText parts={flow.bridge.ours} />
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
