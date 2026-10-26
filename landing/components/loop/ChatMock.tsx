import { memo } from 'react';
import { RichText } from '@/lib/rich';
import { ExampleBadge } from '@/components/ui/ExampleBadge';
import type { ChatItem, LoopShared, LoopTopic } from '@/content/loop';
import { MockTableView } from './parts';

function Item({ item }: { item: ChatItem }) {
  if (item.kind === 'p')
    return (
      <p>
        <RichText parts={item.text} />
      </p>
    );
  if (item.kind === 'tables')
    return (
      <div className="tbls">
        {item.tables.map((t, i) => (
          <MockTableView key={i} table={t} />
        ))}
      </div>
    );
  return <MockTableView table={item.table} />;
}

export const ChatMock = memo(function ChatMock({
  topic,
  shared,
  threadLabel,
}: {
  topic: LoopTopic;
  shared: LoopShared;
  threadLabel: string;
}) {
  return (
    <div className="screen scr-chat">
      <ExampleBadge label={shared.island} className="island" />
      <div className="appbar">
        <span className="subj">{shared.subject}</span>
        <span className="adate">{shared.studyDate}</span>
      </div>
      <div className="thread" tabIndex={0} role="group" aria-label={threadLabel}>
        <p className="m me">{topic.question}</p>
        <div className="m ai">
          <span className="who">{shared.who}</span>
          {topic.explain.map((item, k) => (
            <Item key={k} item={item} />
          ))}
        </div>
        <p className="m ai">
          <span className="who">{shared.who}</span>
          {topic.ask}
        </p>
        <p className="m me">{topic.reply}</p>
        <div className="m ai">
          <span className="who">{shared.who}</span>
          <p>{topic.offer}</p>
        </div>
      </div>
      <div className="composer">
        <span className="gpt">
          {shared.gpt} <small>{shared.gptState}</small>
        </span>
        <span className="field-mock" aria-hidden="true">
          <span className="ph">{shared.placeholder}</span>
        </span>
        <span className="send" aria-hidden="true" />
      </div>
    </div>
  );
});
