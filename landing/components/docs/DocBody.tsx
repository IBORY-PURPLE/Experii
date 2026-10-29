import { docsUi, type DocBlock } from '@/content/docs';
import { ExampleBadge } from '@/components/ui/ExampleBadge';
import { RichText } from '@/lib/rich';

function Block({ block }: { block: DocBlock }) {
  switch (block.kind) {
    case 'p':
      return (
        <p>
          <RichText parts={block.text} />
        </p>
      );
    case 'list':
      return (
        <ul className="doc-list">
          {block.items.map((item, i) => (
            <li key={i}>
              <RichText parts={item} />
            </li>
          ))}
        </ul>
      );
    case 'steps':
      return (
        <ol className="doc-steps">
          {block.items.map((s, i) => (
            <li key={s.title} className={`is-${s.color}`}>
              <span className="doc-step-n" aria-hidden="true">
                {i + 1}
              </span>
              <div>
                <h3>
                  {s.title}
                  {s.soon && <span className="soon">{docsUi.soon}</span>}
                </h3>
                <p>{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      );
    case 'card':
      return (
        <figure className="doc-card">
          <div className="doc-card-top">
            <span>{block.meta}</span>
            <ExampleBadge label={docsUi.example} />
          </div>
          <blockquote>{block.answer}</blockquote>
          <figcaption>{block.source}</figcaption>
        </figure>
      );
    case 'qa':
      return (
        <dl className="doc-qa">
          {block.items.map((item) => (
            <div key={item.q}>
              <dt>{item.q}</dt>
              <dd>
                <RichText parts={item.a} />
              </dd>
            </div>
          ))}
        </dl>
      );
    case 'link':
      return (
        <p>
          <a className="doc-link" href={block.href}>
            {block.text} →
          </a>
        </p>
      );
  }
}

export function DocBody({ blocks }: { blocks: DocBlock[] }) {
  return blocks.map((b, i) => <Block key={i} block={b} />);
}
