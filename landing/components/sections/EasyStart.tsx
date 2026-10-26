import { easyStart } from '@/content/landing';
import { ExampleBadge } from '@/components/ui/ExampleBadge';
import { RichText } from '@/lib/rich';

export function EasyStart() {
  const { mini } = easyStart;
  return (
    <section id="start" className="sec easy" aria-labelledby="es-h">
      <div className="wrap">
        <div className="sec-head">
          <h2 id="es-h" className="h2">
            {easyStart.title}
          </h2>
        </div>
        <div className="es">
          <ExampleBadge label={easyStart.badge} />
          <ol className="es-steps">
            {easyStart.steps.map((s, i) => (
              <li key={s.lead}>
                <span className="es-num" aria-hidden="true">
                  {i + 1}
                </span>
                <p className="two">
                  <b>{s.lead}</b>
                  {s.rest}
                </p>
                {i === 0 ? (
                  <div className="mini mj" aria-hidden="true">
                    <span className="mj-logo">{mini.brand}</span>
                    <span className="mj-bar" />
                    <span className="mj-btn">{mini.start}</span>
                  </div>
                ) : null}
                {i === 1 ? (
                  <div className="mini mc">
                    <p className="mc-t">{mini.connectTitle}</p>
                    <p className="mc-row">
                      <span>{mini.connectRow}</span>
                      <span className="wait">{mini.pending}</span>
                    </p>
                  </div>
                ) : null}
                {i === 2 ? (
                  <div className="mini ma" aria-hidden="true">
                    <p className="ma-field">
                      <span className="ma-chip">{mini.subject}</span>
                      <span className="ma-ph">{mini.placeholder}</span>
                    </p>
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
        <div className="es-band">
          <p className="two">
            <RichText parts={easyStart.band} />
          </p>
          <a className="btn btn-ink" href="#signup" data-cta="easy_start">
            {easyStart.cta}
          </a>
        </div>
      </div>
    </section>
  );
}
