import { memo } from 'react';
import { RichText } from '@/lib/rich';
import { ExampleBadge } from '@/components/ui/ExampleBadge';
import type { ChatItem, LoopShared, LoopTopic, TopicId } from '@/content/loop';
import { MockTableView } from './parts';

function Item({ item, className }: { item: ChatItem; className?: string }) {
  if (item.kind === 'p')
    return (
      <p className={className}>
        <RichText parts={item.text} />
      </p>
    );
  if (item.kind === 'tables')
    return (
      <div className={className ? `tbls ${className}` : 'tbls'}>
        {item.tables.map((t, i) => (
          <MockTableView key={i} table={t} />
        ))}
      </div>
    );
  return <MockTableView table={item.table} className={className} />;
}

export const ChatMock = memo(function ChatMock({
  topic,
  shared,
  chips,
  threadLabel,
  at,
  fresh,
  typed,
}: {
  topic: LoopTopic;
  shared: LoopShared;
  chips: { id: TopicId; chip: string }[];
  threadLabel: string;
  at: number;
  fresh: number;
  typed: string;
}) {
  const n2 = topic.explain.length;
  const f = (i: number) => (i > fresh && i <= at ? 'fresh' : undefined);
  const cx = (base: string, i: number) => (f(i) ? `${base} fresh` : base);
  return (
    <div className="screen scr-chat">
      <ExampleBadge label={shared.island} className="island" />
      <div className="appbar">
        <span className="subj">{shared.subject}</span>
        <span className="adate">{shared.studyDate}</span>
      </div>
      <div className="thread" tabIndex={0} role="group" aria-label={threadLabel}>
        {at === 0 ? (
          <div className="s0">
            <p className="s0-guide">{shared.s0Guide}</p>
            <ul className="s0-tags" aria-hidden="true">
              {chips.map((c) => (
                <li key={c.id} className={c.id === topic.id ? 'cur' : undefined}>
                  {c.chip}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {at >= 1 ? <p className={cx('m me', 1)}>{topic.question}</p> : null}
        {at >= 2 ? (
          <div className={cx('m ai', 2)}>
            <span className="who">{shared.who}</span>
            {topic.explain.map((item, k) =>
              at >= 2 + k ? <Item key={k} item={item} className={k > 0 ? f(2 + k) : undefined} /> : null,
            )}
          </div>
        ) : null}
        {at >= n2 + 2 ? (
          <p className={cx('m ai', n2 + 2)}>
            <span className="who">{shared.who}</span>
            {topic.ask}
          </p>
        ) : null}
        {at >= n2 + 3 ? <p className={cx('m me', n2 + 3)}>{topic.reply}</p> : null}
        {at >= n2 + 4 ? (
          <div className={cx('m ai', n2 + 4)}>
            <span className="who">{shared.who}</span>
            <p>{topic.offer}</p>
            <span className="fake" aria-hidden="true">
              {shared.fakeTake}
            </span>
          </div>
        ) : null}
      </div>
      <div className={typed ? 'composer typing' : 'composer'}>
        <span className="gpt">
          {shared.gpt} <small>{shared.gptState}</small>
        </span>
        <span className="field-mock" aria-hidden="true">
          <span className="ph">{shared.placeholder}</span>
          <span className="typed">{typed}</span>
        </span>
        <span className="send" aria-hidden="true" />
      </div>
    </div>
  );
});
