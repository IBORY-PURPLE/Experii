import { memo } from 'react';
import { ExampleBadge } from '@/components/ui/ExampleBadge';
import type { LoopShared, LoopTopic } from '@/content/loop';
import { MockTableView, SqlBlock } from './parts';

export type Blank =
  | { status: 'empty' }
  | { status: 'wrong'; choice: string }
  | { status: 'right'; choice: string };

export const TaskMock = memo(function TaskMock({
  topic,
  shared,
  threadLabel,
  at,
  fresh,
  busy,
  blank,
  blankRev,
  blankPop,
  resultShown,
  resultFresh,
  onChoose,
}: {
  topic: LoopTopic;
  shared: LoopShared;
  threadLabel: string;
  at: number;
  fresh: number;
  busy: boolean;
  blank: Blank;
  blankRev: number;
  blankPop: boolean;
  resultShown: boolean;
  resultFresh: boolean;
  onChoose: (option: string) => void;
}) {
  const cx = (base: string, i: number) => (i > fresh && i <= at ? `${base} fresh` : base);
  const blankCls = [
    'blank',
    blank.status === 'right' ? 'is-right' : blank.status === 'wrong' ? 'is-wrong' : '',
    blankPop && blank.status !== 'empty' ? 'pop' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const blankEl = (
    <span key={blankRev} className={blankCls}>
      {blank.status === 'empty' ? '[ ? ]' : blank.choice}
    </span>
  );
  const right = topic.right.result;

  return (
    <div className="screen scr-task">
      <ExampleBadge label={shared.island} className="island" />
      <div className="appbar">
        <span className="subj">{shared.subject}</span>
        <span className="adate">{shared.studyDate}</span>
      </div>
      <div className="thread" tabIndex={0} role="group" aria-label={threadLabel}>
        {at >= 1 ? (
          <div className={cx('m ai ctx', 1)}>
            <span className="who">{shared.who}</span>
            <p>{topic.offer}</p>
            <span className="fake muted" aria-hidden="true">
              {shared.fakeTake}
            </span>
          </div>
        ) : null}
        {at >= 1 ? (
          <div className={cx(busy ? 'status busy' : 'status', 1)}>
            <p className="status-label">{shared.status}</p>
            <ol className="checks">
              {topic.checks.map((c, k) =>
                at >= 2 + k ? (
                  <li key={k} className={2 + k > fresh ? 'fresh' : undefined}>
                    <span>
                      <b>{c.b}</b>
                      {c.rest ? ` · ${c.rest}` : null}
                    </span>
                  </li>
                ) : null,
              )}
            </ol>
          </div>
        ) : null}
        {at >= 5 ? (
          <article className={cx('task key', 5)}>
            <div className="task-h">
              <span className="task-pill">{shared.taskPill}</span>
              <span className="task-from">{topic.task.from}</span>
            </div>
            <p>{topic.task.body}</p>
            <p className="task-tables">
              <span className="k">{shared.tablesLabel}</span>
              {topic.task.tables.map((t) => (
                <code key={t}>{t}</code>
              ))}
            </p>
            {topic.task.note ? <p className="task-note">{topic.task.note}</p> : null}
          </article>
        ) : null}
        {at >= 6 ? (
          <div className={cx('solve', 6)}>
            <SqlBlock lines={topic.sql} blank={blankEl} />
            <div className="opts" role="group" aria-label={topic.optionsLabel}>
              {topic.options.map((o) => {
                const pressed = blank.status !== 'empty' && blank.choice === o;
                return (
                  <button
                    key={o}
                    type="button"
                    className={pressed && blank.status === 'wrong' ? 'opt wrong' : 'opt'}
                    aria-pressed={pressed}
                    onClick={() => onChoose(o)}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
            <div className="run">
              <span className="fake muted" aria-hidden="true">
                {shared.fakeRun}
              </span>
            </div>
            <div className={resultFresh ? 'result fresh' : 'result'}>
              {resultShown && blank.status === 'right' ? (
                <>
                  {'columns' in right ? (
                    <MockTableView table={right} className="res-table" />
                  ) : (
                    <p className="res-line">
                      <span className="res-chip ok">{right.chip}</span>
                      <span>{right.line}</span>
                    </p>
                  )}
                  <p className="m ai">
                    <span className="who">{shared.who}</span>
                    {topic.right.ai}
                  </p>
                </>
              ) : null}
              {resultShown && blank.status === 'wrong' ? (
                <>
                  <p className="res-chip bad">{topic.wrong.chip}</p>
                  <p className="m ai">
                    <span className="who">{shared.who}</span>
                    {topic.wrong.ai}
                  </p>
                </>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
});
