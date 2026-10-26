'use client';

import '@/components/loop/mock.css';
import './hero-demo.css';
import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { AppWindow, type NavId } from '@/components/app-window/AppWindow';
import { ExperienceCard } from '@/components/loop/ExperienceCard';
import { MockTableView, SqlBlock } from '@/components/loop/parts';
import { useTimeline, type TimelineEvent } from '@/components/loop/useTimeline';
import { RichText } from '@/lib/rich';
import type { ChatItem, HeroDemoCopy, LoopShared, LoopTopic } from '@/content/loop';

type Scene = 'home' | 'study' | 'opened';
type Play = 'idle' | 'playing' | 'paused' | 'ended';
type Target = 'input' | 'send' | 'take' | 'answer' | 'save' | 'toast';
type Count = 0 | 1 | 2 | 3;
// What the thread keeps in view: its newest line, or the saved card from its head down.
type Focus = 'end' | 'card';

// One frame of the illustration. The script below only ever sets these fields.
interface Frame {
  scene: Scene;
  ask: string;
  reply: string;
  at: number;
  focus: Focus;
  answered: boolean;
  saved: boolean;
  remind: Count;
  dots: Count;
  press: number;
}

type Cue =
  | { t: number; set: Partial<Frame> }
  | { t: number; type: 'ask' | 'reply'; dur: number }
  | { t: number; move: Target; dur: number }
  | { t: number; press: Partial<Frame> };

// Thread positions: `at >= marks.x` means item x is on screen. Checks follow status at +1..+3.
const marks = (t: LoopTopic) => {
  const n = t.explain.length;
  return { q: 1, explain: 2, ask: n + 2, reply: n + 3, offer: n + 4, status: n + 5, task: n + 9, solve: n + 10, result: n + 11, cardAi: n + 12, card: n + 13 };
};

const START: Frame = { scene: 'home', ask: '', reply: '', at: 0, focus: 'end', answered: false, saved: false, remind: 0, dots: 0, press: 0 };
const finalFrame = (t: LoopTopic): Frame => ({ ...START, scene: 'opened', at: marks(t).card, answered: true, saved: true, dots: 3 });

// Each key beat (task card, SQL with its options, result, the card's answer line) stays whole on screen
// this long before the next one pushes it up.
const READ = 2800;
// Playback needs this much of the thread above the fold: the tallest key beat (SQL with options) fits.
const MIN_ROOM = 200;

function script(t: LoopTopic): { cues: Cue[]; total: number } {
  const M = marks(t);
  const n = t.explain.length;
  const cues: Cue[] = [
    { t: 700, type: 'ask', dur: 1400 },
    { t: 2350, move: 'send', dur: 600 },
    { t: 3000, press: {} },
    { t: 3250, set: { scene: 'study', ask: '', at: M.q } },
  ];
  for (let k = 0; k < n; k++) cues.push({ t: 3750 + 420 * k, set: { at: M.explain + k } });
  const c = 3750 + 420 * n + 400;
  const task = c + 4200;
  const solve = task + READ;
  const result = solve + READ + 100;
  const card = result + READ + 450;
  const saved = card + READ + 1200;
  cues.push(
    { t: c, set: { at: M.ask } },
    { t: c + 500, type: 'reply', dur: 700 },
    { t: c + 1300, set: { reply: '', at: M.reply } },
    { t: c + 1800, set: { at: M.offer } },
    { t: c + 2350, move: 'take', dur: 600 },
    { t: c + 3000, press: { at: M.status } },
    { t: c + 3250, set: { at: M.status + 1 } },
    { t: c + 3500, set: { at: M.status + 2 } },
    { t: c + 3750, set: { at: M.status + 3 } },
    { t: task, set: { at: M.task } },
    { t: solve, set: { at: M.solve } },
    { t: solve + 1100, move: 'answer', dur: 700 },
    { t: solve + 1850, press: { answered: true } },
    { t: result, set: { at: M.result } },
    { t: result + READ, set: { at: M.cardAi } },
    { t: card, set: { at: M.card, focus: 'card' } },
    { t: card + READ, set: { focus: 'end' } },
    { t: card + READ + 500, move: 'save', dur: 650 },
    { t: saved, press: { saved: true } },
    { t: saved + 1250, set: { remind: 1 } },
    { t: saved + 2650, set: { remind: 2 } },
    { t: saved + 4050, set: { remind: 3 } },
    { t: saved + 4750, move: 'toast', dur: 700 },
    { t: saved + 5500, press: {} },
    { t: saved + 5700, set: { scene: 'opened', remind: 0 } },
    { t: saved + 6150, set: { dots: 1 } },
    { t: saved + 6300, set: { dots: 2 } },
    { t: saved + 6450, set: { dots: 3 } },
  );
  return { cues, total: saved + 7150 };
}

const ease = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);
const translateY = (el: HTMLElement) => {
  const tf = getComputedStyle(el).transform;
  return tf === 'none' ? 0 : new DOMMatrixReadOnly(tf).m42;
};

const ICONS: Record<Play, ReactNode> = {
  idle: <path d="M5 3.2v9.6l7.6-4.8z" fill="currentColor" />,
  paused: <path d="M5 3.2v9.6l7.6-4.8z" fill="currentColor" />,
  playing: (
    <>
      <rect x="3.8" y="3.2" width="2.8" height="9.6" rx="1" fill="currentColor" />
      <rect x="9.4" y="3.2" width="2.8" height="9.6" rx="1" fill="currentColor" />
    </>
  ),
  ended: (
    <>
      <path d="M12.6 9.2A4.8 4.8 0 1 1 11 4.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M11.6 1.8v3.4H8.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
};

function Explain({ item }: { item: ChatItem }) {
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

// Server HTML (and so the no-JS page) and the first client render show the finished loop; playback
// switches to the first frame only when it actually starts.
export function HeroDemo({ topic, shared, copy }: { topic: LoopTopic; shared: LoopShared; copy: HeroDemoCopy }) {
  const [f, setFrame] = useState<Frame>(() => finalFrame(topic));
  const [play, setPlay] = useState<Play>('idle');
  const fRef = useRef(f);
  const playRef = useRef<Play>('idle');
  const hold = useRef({ hidden: false, off: true });
  const reduced = useRef(false);
  const winRef = useRef<HTMLDivElement>(null);
  const ctrlRef = useRef<HTMLButtonElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const flowY = useRef(0);
  const aim = useRef<Target | null>(null);
  const tl = useTimeline();
  const M = marks(topic);

  const commit = (patch: Partial<Frame>) => {
    fRef.current = { ...fRef.current, ...patch };
    setFrame(fRef.current);
  };
  const setMode = (p: Play) => {
    playRef.current = p;
    setPlay(p);
  };
  const setCursor = (x: number, y: number) => {
    pos.current = { x, y };
    if (cursorRef.current) cursorRef.current.style.transform = `translate(${x}px, ${y}px)`;
  };
  // Where the pointer should land, measured against the thread's resting scroll offset.
  const point = (target: Target) => {
    const win = winRef.current;
    const el = win?.querySelector<HTMLElement>(`[data-t="${target}"]`);
    if (!win || !el) return null;
    const r = el.getBoundingClientRect();
    const w = win.getBoundingClientRect();
    let y = r.top - w.top + r.height / 2;
    const flow = flowRef.current;
    if (flow?.contains(el)) y += flowY.current - translateY(flow);
    const x = r.left - w.left + (target === 'input' ? Math.min(r.width * 0.3, 180) : r.width / 2);
    return { x, y };
  };

  const events = (cues: Cue[]): TimelineEvent[] =>
    cues.map((c): TimelineEvent => {
      if ('set' in c) return { t: c.t, fn: () => commit(c.set) };
      if ('press' in c)
        return {
          t: c.t,
          fn: () => {
            aim.current = null;
            commit({ ...c.press, press: fRef.current.press + 1 });
            fit();
          },
        };
      if ('type' in c) {
        const field = c.type;
        const text = field === 'ask' ? topic.question : topic.reply;
        return {
          t: c.t,
          dur: c.dur,
          frame: (p) => {
            const v = reduced.current ? text : text.slice(0, Math.ceil(text.length * p));
            if (fRef.current[field] !== v) commit(field === 'ask' ? { ask: v } : { reply: v });
          },
        };
      }
      let from = pos.current;
      let to = from;
      return {
        t: c.t,
        dur: c.dur,
        fn: () => {
          aim.current = c.move;
          from = pos.current;
          to = point(c.move) ?? from;
        },
        frame: (p) => {
          const e = reduced.current ? 1 : ease(p);
          setCursor(from.x + (to.x - from.x) * e, from.y + (to.y - from.y) * e);
        },
      };
    });

  const sync = () => {
    const held = hold.current.hidden || hold.current.off;
    if (playRef.current === 'playing' && !held) tl.play();
    else tl.pause();
  };

  const begin = () => {
    tl.stop();
    aim.current = null;
    commit(START);
    const p = point('input');
    if (p) setCursor(p.x, p.y);
    const { cues, total } = script(topic);
    setMode('playing');
    tl.start(events(cues), { total, onEnd: () => setMode('ended') });
    sync();
  };

  const onControl = () => {
    if (playRef.current === 'playing') {
      setMode('paused');
      tl.pause();
    } else if (playRef.current === 'paused') {
      setMode('playing');
      sync();
    } else begin();
  };

  // Runs only while the pause control is uncovered (below the sticky header's scroll-padding) and enough
  // of the thread is above the fold to hold a whole key beat; otherwise the timeline holds where it is.
  const gate = () => {
    const ctrl = ctrlRef.current?.getBoundingClientRect();
    const vp = threadRef.current?.getBoundingClientRect();
    if (!ctrl || !vp) return;
    const inset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const off = !ctrl.height || ctrl.top < inset || innerHeight - vp.top < MIN_ROOM;
    if (off === hold.current.off) return;
    hold.current.off = off;
    if (!off && playRef.current === 'idle') begin();
    else sync();
  };

  // Slide the thread (not scroll it) so its newest line, or the card's head, sits inside the part of the
  // window that is on screen. The camera holds still while the pointer travels to a target in the thread.
  const fit = () => {
    const vp = threadRef.current;
    const flow = flowRef.current;
    if (!vp || !flow || aim.current) return;
    const room = Math.min(vp.clientHeight, Math.max(MIN_ROOM, innerHeight - vp.getBoundingClientRect().top - 8));
    let y = room - flow.offsetHeight;
    const lead = fRef.current.focus === 'card' ? flow.querySelector<HTMLElement>('.hd-card') : null;
    if (lead) y = Math.max(y, flow.getBoundingClientRect().top - lead.getBoundingClientRect().top + 12);
    y = Math.min(0, Math.round(y));
    if (y === flowY.current) return;
    flowY.current = y;
    flow.style.transform = y ? `translateY(${y}px)` : '';
  };

  const api = useRef({ begin, sync, setMode, gate, fit });
  api.current = { begin, sync, setMode, gate, fit };

  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    reduced.current = mq.matches;
    hold.current.hidden = document.visibilityState === 'hidden';
    if (mq.matches) api.current.setMode('ended');
    const onMotion = (e: MediaQueryListEvent) => {
      reduced.current = e.matches;
    };
    const onVisibility = () => {
      hold.current.hidden = document.visibilityState === 'hidden';
      api.current.sync();
    };
    let raf = 0;
    const onView = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        api.current.gate();
        api.current.fit();
      });
    };
    onView();
    document.fonts?.ready.then(onView);
    window.addEventListener('scroll', onView, { passive: true });
    window.addEventListener('resize', onView);
    mq.addEventListener('change', onMotion);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onView);
      window.removeEventListener('resize', onView);
      mq.removeEventListener('change', onMotion);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  useLayoutEffect(() => api.current.fit(), [f.at, f.answered, f.focus]);

  const count = copy.recent.length + (f.saved ? 1 : 0);
  const nav: NavId = f.scene === 'opened' ? 'cards' : f.remind > 0 ? 'remind' : 'study';
  const title =
    f.scene === 'opened' ? shared.openedTitle : f.remind > 0 ? shared.nav.remind : f.scene === 'study' ? topic.question : shared.nav.study;
  const right = topic.right.result;
  const scene = (s: Scene) => (f.scene === s ? 'hd-scene on' : 'hd-scene');
  const ldPos = (j: number) => (j < f.remind - 1 ? 'past' : j === f.remind - 1 ? 'now' : 'next');
  const toastOff = (j: number) => (j < f.remind ? String(f.remind - 1 - j) : 'pre');
  // Every label sits in one grid cell, so the button keeps the widest one's width in every state.
  const labels = [...new Set(Object.values(copy.control))];

  return (
    <div className="hero-demo" data-play={play} data-scene={f.scene} data-remind={f.remind}>
      <p className="sr-only">{copy.summary}</p>
      <div className="hd-win" ref={winRef}>
        <AppWindow
          shared={shared}
          title={title}
          active={nav}
          count={count}
          bump={f.saved}
          mainClassName="mock"
          tools={
            <button type="button" className="hd-ctrl" ref={ctrlRef} onClick={onControl}>
              <i aria-hidden="true">
                <svg viewBox="0 0 16 16" width="12" height="12">
                  {ICONS[play]}
                </svg>
              </i>
              <span className="hd-ctrl-l">
                {labels.map((l) => (
                  <span key={l} className={l === copy.control[play] ? 'on' : undefined}>
                    {l}
                  </span>
                ))}
              </span>
              <span className="sr-only"> · {copy.controlTarget}</span>
            </button>
          }
        >
          <div className={scene('home')} aria-hidden="true">
            <div className="hd-ask-wrap">
              <i className="hd-mark">{shared.appIcon}</i>
              <div className={f.ask ? 'hd-ask typing' : 'hd-ask'} data-t="input">
                <span className="hd-ask-text">{f.ask ? <span className="typed">{f.ask}</span> : shared.s0Guide}</span>
                <span className="send" data-t="send" />
              </div>
              <p className="hd-gpt">
                {shared.gpt} · {shared.gptState}
              </p>
            </div>
            <div className="hd-recent">
              <p className="hd-k">{copy.recentTitle}</p>
              <ul>
                {copy.recent.map((r) => (
                  <li key={r.title}>
                    <p className="xl-stamp">
                      <span className="when">{r.when}</span>
                      {r.meta}
                    </p>
                    <p className="hd-tile-t">{r.title}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className={scene('study')} aria-hidden="true">
            <div className="appbar">
              <span className="subj">{shared.subject}</span>
              <span className="adate">{shared.studyDate}</span>
            </div>
            <div className="hd-thread" ref={threadRef}>
              <div className="hd-flow" ref={flowRef}>
                {f.at >= M.q ? <p className="m me">{topic.question}</p> : null}
                {f.at >= M.explain ? (
                  <div className="m ai">
                    <span className="who">{shared.who}</span>
                    {topic.explain.map((item, k) => (f.at >= M.explain + k ? <Explain key={k} item={item} /> : null))}
                  </div>
                ) : null}
                {f.at >= M.ask ? (
                  <p className="m ai">
                    <span className="who">{shared.who}</span>
                    {topic.ask}
                  </p>
                ) : null}
                {f.at >= M.reply ? <p className="m me">{topic.reply}</p> : null}
                {f.at >= M.offer ? (
                  <div className="m ai">
                    <span className="who">{shared.who}</span>
                    <p>{topic.offer}</p>
                    <span className="fake" data-t="take">
                      {shared.fakeTake}
                    </span>
                  </div>
                ) : null}
                {f.at >= M.status ? (
                  <div className="status">
                    <p className="status-label">{shared.status}</p>
                    <ol className="checks">
                      {topic.checks.map((c, k) =>
                        f.at >= M.status + 1 + k ? (
                          <li key={k}>
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
                {f.at >= M.task ? (
                  <article className="task key">
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
                  </article>
                ) : null}
                {f.at >= M.solve ? (
                  <div className="solve">
                    <SqlBlock
                      lines={topic.sql}
                      blank={
                        <span key={String(f.answered)} className={f.answered ? 'blank is-right pop' : 'blank'}>
                          {f.answered ? topic.answer : '[ ? ]'}
                        </span>
                      }
                    />
                    <div className="opts">
                      {topic.options.map((o) => (
                        <span
                          key={o}
                          className={f.answered && o === topic.answer ? 'opt on' : 'opt'}
                          data-t={o === topic.answer ? 'answer' : undefined}
                        >
                          {o}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {f.at >= M.result ? (
                  <div className="result">
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
                  </div>
                ) : null}
                {f.at >= M.cardAi ? (
                  <p className="m ai">
                    <span className="who">{shared.who}</span>
                    {shared.cardAi}
                  </p>
                ) : null}
                {f.at >= M.card ? (
                  <div className="hd-card">
                    <ExperienceCard card={topic.card} shared={shared} snippetVisible showPlan showTags={false} showSource={false} isKey />
                    <span className={f.saved ? 'fake save done' : 'fake save'} data-t="save">
                      {shared.fakeSave}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
            <div className={f.reply ? 'composer typing' : 'composer'}>
              <span className="hd-gpt">
                {shared.gpt} · {shared.gptState}
              </span>
              <span className="field-mock">
                <span className="ph">{shared.placeholder}</span>
                <span className="typed">{f.reply}</span>
              </span>
              <span className="send" />
            </div>
            {f.saved && f.remind === 0 ? <p className="toast hd-toast">{shared.toast}</p> : null}
          </div>

          <div className={scene('opened')} aria-hidden="true">
            <div className="appbar">
              <span className="ab-title">{shared.openedTitle}</span>
              <span className="adate">{shared.openedDate}</span>
            </div>
            <div className="hd-open">
              <div className="hd-open-card">
                <p className="revisit-line">
                  {shared.revisitLabel}
                  {shared.revisitDates.map((d, j) => (
                    <Fragment key={d}>
                      {' · '}
                      <span className="rv">
                        <i className={f.dots > j ? 'dot on' : 'dot'} />
                        {d}
                      </span>
                    </Fragment>
                  ))}
                </p>
                <ExperienceCard card={topic.card} shared={shared} snippetVisible showPlan={false} showTags showSource />
              </div>
              <div className="follow">
                <p className="fl-label">{shared.reminderLabels[2]}</p>
                <p className="fl-q">{topic.follow.question}</p>
                {topic.follow.tail ? (
                  <>
                    <p className="fl-k">{shared.followTail}</p>
                    <p>{topic.follow.tail.q}</p>
                    <SqlBlock lines={topic.follow.tail.sql} />
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div className="hd-remind" aria-hidden="true">
            <p className="hd-date">
              {shared.lockDates.map((d, j) => (
                <span key={d.md} className="ld" data-pos={ldPos(j)}>
                  <span className="md">{d.md}</span>
                  <span className="dow">{d.dow}</span>
                </span>
              ))}
            </p>
            <p className="lock-badge">{shared.lockBadge}</p>
            <ol className="hd-toasts">
              {topic.reminders.map((r, j) => (
                <li key={j} className="notif" data-off={toastOff(j)} data-t={j === 2 ? 'toast' : undefined}>
                  <span className="n-head">
                    <i className="n-ico">{shared.appIcon}</i>
                    <span className="n-app">{shared.appName}</span>
                    <span className="n-label"> · {shared.reminderLabels[j]}</span>
                  </span>
                  <span className="hd-n-date">{shared.reminderDates[j]}</span>
                  <span className="n-body">{r.preview}</span>
                </li>
              ))}
            </ol>
          </div>
        </AppWindow>
        <div className="hd-cursor" ref={cursorRef} aria-hidden="true">
          {f.press ? <i key={f.press} className="hd-press" /> : null}
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path d="M5 2.5v15.2l3.9-3.6 2.6 5.6 2.5-1.1-2.6-5.5h5.3z" fill="#fff" stroke="#1a2233" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}
