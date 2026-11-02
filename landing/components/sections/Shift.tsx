import { shift } from '@/content/landing';
import { RichText } from '@/lib/rich';

export function Shift() {
  const [first, second] = shift.bubbles;
  return (
    <section id="shift" className="sec shift" aria-labelledby="sh-h">
      <div className="wrap shift-grid">
        <div>
          <h2 id="sh-h" data-reveal="">
            {shift.title.map((line, i) => (
              <span key={line}>
                {line}
                {i < shift.title.length - 1 ? ' ' : null}
              </span>
            ))}
          </h2>
          <p className="two" data-reveal="">
            <RichText parts={shift.body} />
          </p>
        </div>
        <div className="shift-q">
          <span className="who" data-reveal="">{shift.interviewer}</span>
          <p className="bub" data-reveal="">{first}</p>
          <p className="bub bub-strong" data-reveal="">{second}</p>
        </div>
      </div>
    </section>
  );
}
