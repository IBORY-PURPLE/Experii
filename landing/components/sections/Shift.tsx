import { shift } from '@/content/landing';
import { RichText } from '@/lib/rich';

export function Shift() {
  const [first, second] = shift.bubbles;
  return (
    <section id="shift" className="sec shift" aria-labelledby="sh-h">
      <div className="wrap shift-grid">
        <div>
          <h2 id="sh-h">
            {shift.title.map((line, i) => (
              <span key={line}>
                {line}
                {i < shift.title.length - 1 ? ' ' : null}
              </span>
            ))}
          </h2>
          <p className="two">
            <RichText parts={shift.body} />
          </p>
        </div>
        <div className="shift-q">
          <span className="who">{shift.interviewer}</span>
          <p className="bub">{first}</p>
          <p className="bub bub-strong">{second}</p>
        </div>
      </div>
    </section>
  );
}
