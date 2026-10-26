import { memo, type Ref } from 'react';
import { ExampleBadge } from '@/components/ui/ExampleBadge';
import type { LoopShared, LoopTopic } from '@/content/loop';
import { ExperienceCard } from './ExperienceCard';
import { SqlBlock } from './parts';

export const CardMock = memo(function CardMock({
  topic,
  shared,
  chatLabel,
  listLabel,
  at,
  fresh,
  listShown,
  listFresh,
  flyRef,
  onSave,
}: {
  topic: LoopTopic;
  shared: LoopShared;
  chatLabel: string;
  listLabel: string;
  at: 0 | 1 | 2;
  fresh: number;
  listShown: boolean;
  listFresh: boolean;
  flyRef?: Ref<HTMLSpanElement>;
  onSave: () => void;
}) {
  const isFresh = (i: number) => i > fresh && i <= at;
  const list = topic.list;
  return (
    <div className="screen scr-card">
      <ExampleBadge label={shared.island} className="island" />
      <div className={listShown ? 'layer l-chat covered' : 'layer l-chat'}>
        <div className="appbar">
          <span className="subj">{shared.subject}</span>
          <span className="adate">{shared.studyDate}</span>
        </div>
        <div className="thread" tabIndex={0} role="group" aria-label={chatLabel}>
          <SqlBlock lines={topic.excerpt} className="ctx" srcLine={topic.flyLine} />
          {at >= 1 ? (
            <>
              <p className={isFresh(1) ? 'm ai fresh' : 'm ai'}>
                <span className="who">{shared.who}</span>
                {shared.cardAi}
              </p>
              <ExperienceCard
                card={topic.card}
                shared={shared}
                snippetVisible={at >= 2}
                snippetFresh={isFresh(2)}
                showPlan
                showTags={false}
                showSource={false}
                fresh={isFresh(1)}
              />
              <button type="button" className={isFresh(1) ? 'save-btn fresh' : 'save-btn'} onClick={onSave}>
                {shared.fakeSave}
              </button>
            </>
          ) : null}
        </div>
      </div>
      <div className={listShown ? 'layer l-list shown' : 'layer l-list'}>
        <div className="appbar">
          <span className="ab-title">{shared.listTitle}</span>
          <span className="adate">{shared.studyDate}</span>
        </div>
        <div className="xscroll" tabIndex={0} role="group" aria-label={listLabel}>
          <ol className="xlist">
            <li className="xl-new">
              <p className="xl-stamp">
                <span className="when">{list.now.when}</span>
                {list.now.meta}
              </p>
              <p className="xl-title">{list.now.title}</p>
              <ExperienceCard
                card={topic.card}
                shared={shared}
                snippetVisible
                showPlan
                showTags
                showSource
                isKey
              />
            </li>
            {list.old.map((row) => (
              <li key={row.title} className="xl-old ctx">
                <p className="xl-stamp">
                  <span className="when">{row.when}</span>
                  {row.meta}
                </p>
                <p>{row.title}</p>
              </li>
            ))}
          </ol>
        </div>
        <p className={listFresh ? 'toast fresh' : 'toast'}>{shared.toast}</p>
      </div>
      <span className="fly" aria-hidden="true" ref={flyRef}>
        <span>{topic.card.snippet}</span>
      </span>
    </div>
  );
});
