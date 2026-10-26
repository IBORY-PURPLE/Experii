import { Fragment, memo, type Ref } from 'react';
import { ExampleBadge } from '@/components/ui/ExampleBadge';
import type { LoopCopy, LoopShared, LoopTopic } from '@/content/loop';
import { ExperienceCard } from './ExperienceCard';
import { SqlBlock } from './parts';

export const ReminderMock = memo(function ReminderMock({
  topic,
  shared,
  remind,
  threadLabel,
  ready,
  index,
  opened,
  revisitFilled,
  onAdvance,
  cardTitleRef,
}: {
  topic: LoopTopic;
  shared: LoopShared;
  remind: LoopCopy['remind'];
  threadLabel: string;
  ready: boolean;
  index: -1 | 0 | 1 | 2;
  opened: boolean;
  revisitFilled: 0 | 1 | 2 | 3;
  onAdvance: (fromHit: boolean) => void;
  cardTitleRef?: Ref<HTMLSpanElement>;
}) {
  const k = Math.max(index, 0);
  // Desktop notifications, as in the hero: only arrived ones show, the newest in front.
  const off = (j: number) => (index < 0 || j > index ? 'pre' : String(index - j));
  const tail = topic.follow.tail;
  return (
    <div className="screen scr-lock">
      <ExampleBadge label={shared.island} className="island" />
      <div className={opened ? 'layer l-card shown' : 'layer l-card'}>
        <div className="appbar">
          <span className="ab-title" tabIndex={-1} ref={cardTitleRef}>
            {shared.openedTitle}
          </span>
          <span className="adate">{shared.openedDate}</span>
        </div>
        <div className="thread" tabIndex={0} role="group" aria-label={threadLabel}>
          <p className="revisit-line">
            {shared.revisitLabel}
            {shared.revisitDates.map((d, j) => (
              <Fragment key={d}>
                {' · '}
                <span className="rv">
                  <i className={revisitFilled > j ? 'dot on' : 'dot'} aria-hidden="true" />
                  {d}
                </span>
              </Fragment>
            ))}
          </p>
          <ExperienceCard
            card={topic.card}
            shared={shared}
            snippetVisible
            showPlan={false}
            showTags
            showSource
          />
          <div className="follow">
            <p className="fl-label">{shared.reminderLabels[2]}</p>
            <p className="fl-q">{topic.follow.question}</p>
            {tail ? (
              <>
                <p className="fl-k">{shared.followTail}</p>
                <p>{tail.q}</p>
                <SqlBlock lines={tail.sql} />
              </>
            ) : null}
          </div>
        </div>
      </div>
      <div className={opened ? 'lock up' : 'lock'}>
        <div className="lock-when">
          <p className="lock-date" aria-hidden="true">
            {shared.lockDates.map((d, j) => (
              <span key={d.md} className="ld" data-pos={j < k ? 'past' : j === k ? 'now' : 'next'}>
                <span className="md">{d.md}</span>
                <span className="dow">{d.dow}</span>
              </span>
            ))}
          </p>
          <p className="lock-badge">{shared.lockBadge}</p>
        </div>
        <div className="lock-toasts">
          <ol className="stack">
            {topic.reminders.map((r, j) => {
              const front = off(j) === '0';
              return (
                <li key={j} className="notif" data-off={off(j)} aria-hidden={ready && !front ? true : undefined}>
                  <span className="n-date">{shared.reminderDates[j]}</span>
                  <span className="n-head">
                    <i className="n-ico" aria-hidden="true">
                      {shared.appIcon}
                    </i>
                    <span className="n-app">{shared.appName}</span>
                    <span className="n-label"> · {shared.reminderLabels[j]}</span>
                  </span>
                  <span className="n-body">{r.preview}</span>
                  {r.more ? <span className="n-more">{r.more}</span> : null}
                  <button
                    type="button"
                    className="n-hit"
                    aria-label={j === 2 ? remind.hitOpen : remind.hitNext}
                    hidden={!front || opened}
                    onClick={() => onAdvance(true)}
                  />
                </li>
              );
            })}
          </ol>
          <p className="lock-hint" aria-hidden="true">
            {shared.lockHint}
          </p>
        </div>
      </div>
    </div>
  );
});
