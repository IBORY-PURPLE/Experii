'use client';

import './mock.css';
import './loop.css';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { flushSync } from 'react-dom';
import { RichText } from '@/lib/rich';
import { track } from '@/lib/analytics';
import type { HeroVariant } from '@/lib/signup-fields';
import { AppWindow, type NavId } from '@/components/app-window/AppWindow';
import type { LoopCopy, LoopShared, LoopTopic, Step, TopicId } from '@/content/loop';
import { ChatMock } from './ChatMock';
import { TaskMock, type Blank } from './TaskMock';
import { CardMock } from './CardMock';
import { ReminderMock } from './ReminderMock';
import { useTimeline, type TimelineEvent } from './useTimeline';

type RIndex = -1 | 0 | 1 | 2;
type Dots = 0 | 1 | 2 | 3;

interface LoopState {
  ready: boolean;
  step: Step;
  topic: TopicId;
  at2: number;
  f2: number;
  busy: boolean;
  blank: Blank;
  blankRev: number;
  blankPop: boolean;
  resultShown: boolean;
  resultFresh: boolean;
  at3: 0 | 1 | 2;
  f3: number;
  listShown: boolean;
  listFresh: boolean;
  reminderIndex: RIndex;
  cardOpened: boolean;
  revisitFilled: Dots;
  enter: Step | null;
  live: string;
  vertical: boolean;
}

interface Props {
  topics: Record<TopicId, LoopTopic>;
  shared: LoopShared;
  copy: LoopCopy;
  variant: HeroVariant;
  cardsBefore: number;
}

// Step intros (DESIGN 5.5-5.7), ms
const T = {
  resultDelay: 240,
  liveDelay: 60,
  introSpeed: { 2: 1.35, 3: 1.3 },
  flyMs: 400,
  remindDays: [1, 7, 30],
  dotStart: 420,
  dotGap: 150,
  seenMs: 1000,
};

const STEPS: Step[] = [1, 2, 3, 4];
const TOPIC_IDS: TopicId[] = ['join', 'group', 'rank'];
const EMPTY: Blank = { status: 'empty' };
const SCROLLER: Record<Step, string> = { 1: '.thread', 2: '.thread', 3: '.l-chat .thread', 4: '.l-card .thread' };

const isTopic = (v: string | null | undefined): v is TopicId => !!v && (TOPIC_IDS as string[]).includes(v);
const topicFromHash = (hash: string) => {
  const m = /^#how-(join|group|rank)$/.exec(hash);
  return m && isTopic(m[1]) ? m[1] : null;
};
const fill = (tpl: string, vars: Record<string, string>) => tpl.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? '');

// Server HTML and the first client render: every step in its finished state (DESIGN 5.2).
function initialState(topics: Record<TopicId, LoopTopic>): LoopState {
  return {
    ready: false,
    step: 1,
    topic: 'join',
    at2: 6,
    f2: 6,
    busy: false,
    blank: { status: 'right', choice: topics.join.answer },
    blankRev: 0,
    blankPop: false,
    resultShown: true,
    resultFresh: false,
    at3: 2,
    f3: 2,
    listShown: true,
    listFresh: false,
    reminderIndex: 0,
    cardOpened: false,
    revisitFilled: 0,
    enter: null,
    live: '',
    vertical: true,
  };
}

const UNTOUCHED: Partial<LoopState> = {
  at2: 0,
  f2: 0,
  busy: false,
  blank: EMPTY,
  blankPop: false,
  resultShown: false,
  resultFresh: false,
  at3: 0,
  f3: 0,
  listShown: false,
  listFresh: false,
  reminderIndex: -1,
  cardOpened: false,
  revisitFilled: 0,
};

export function LoopStepper({ topics, shared, copy, variant, cardsBefore }: Props) {
  const [state, setState] = useState<LoopState>(() => initialState(topics));
  const sRef = useRef(state);
  const stageRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const flyRef = useRef<HTMLSpanElement>(null);
  const cardTitleRef = useRef<HTMLSpanElement>(null);
  const timers = useRef(new Set<number>());
  const intro = useTimeline();
  const introStep = useRef<Step | null>(null);
  const seen = useRef(new Set<Step>([1]));
  const complete = useRef(new Set<Step>([1]));
  const tracked = useRef(new Set<Step>());
  const reduced = useRef(false);
  const lastPick = useRef<{ topic: TopicId; at: number } | null>(null);

  const commit = (patch: Partial<LoopState>, sync = true) => {
    const next = { ...sRef.current, ...patch };
    sRef.current = next;
    if (sync) flushSync(() => setState(next));
    else setState(next);
  };
  const topicNow = () => topics[sRef.current.topic];

  /* timers registry (DESIGN 5.10) */
  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, ms);
    timers.current.add(id);
  };
  const say = (text: string) => {
    commit({ live: '' });
    later(() => commit({ live: text }), T.liveDelay);
  };
  const trackStep = (n: Step) => {
    if (tracked.current.has(n)) return;
    // Opening a later step means step 1 was on screen first, even before the dwell below counted it.
    if (n > 1) trackStep(1);
    tracked.current.add(n);
    track('loop_step', { step: n, variant, topic: sRef.current.topic });
  };

  /* DOM helpers */
  const panel = (n: Step) => panelRefs.current[n - 1] ?? null;
  const scroller = (n: Step) => panel(n)?.querySelector<HTMLElement>(SCROLLER[n]) ?? null;
  const toBottom = (n: Step, smooth: boolean) => {
    const el = scroller(n);
    el?.scrollTo({ top: el.scrollHeight, behavior: smooth && !reduced.current ? 'smooth' : 'auto' });
  };
  const toTop = (n: Step) => {
    const el = scroller(n);
    if (el) el.scrollTop = 0;
  };
  const instant = (fn: () => void) => {
    const st = stageRef.current;
    st?.classList.add('noanim');
    fn();
    if (st) {
      void st.offsetWidth;
      requestAnimationFrame(() => st.classList.remove('noanim'));
    }
  };
  // The chip's flight is scaled with the timeline so it lands before the snippet appears.
  const fly = (speed: number) => {
    const p = panel(3);
    const f = flyRef.current;
    if (reduced.current || !p || !f) return;
    const scr = p.querySelector('.screen');
    const src = p.querySelector('.l-chat .src-line');
    const th = p.querySelector('.l-chat .thread');
    const dst = p.querySelector('.l-chat .xc-snip');
    if (!scr || !src || !th || !dst) return;
    const S = scr.getBoundingClientRect();
    const A = src.getBoundingClientRect();
    const H = th.getBoundingClientRect();
    const B = dst.getBoundingClientRect();
    f.style.setProperty('--x0', `${A.left - S.left}px`);
    f.style.setProperty('--y0', `${Math.min(Math.max(A.top, H.top), H.bottom - 24) - S.top}px`);
    f.style.setProperty('--x1', `${B.left - S.left}px`);
    f.style.setProperty('--y1', `${B.top - S.top}px`);
    f.style.setProperty('--fly-ms', `${Math.round(T.flyMs / speed)}ms`);
    f.classList.remove('go');
    void f.offsetWidth;
    f.classList.add('go');
    later(() => f.classList.remove('go'), Math.round((T.flyMs + 30) / speed));
  };
  const at2 = (n: number, animate = true) => ({ at2: n, f2: animate ? Math.min(sRef.current.at2, n) : n });
  const at3 = (n: 0 | 1 | 2, animate = true) => ({ at3: n, f3: animate ? Math.min(sRef.current.at3, n) : n });

  /* finished state of one step (DESIGN 5.5) */
  const finalState = (n: Step) => {
    const s = sRef.current;
    if (n === 1) toTop(1);
    else if (n === 2) {
      commit({ ...at2(6, false), busy: false, resultShown: s.blank.status !== 'empty' });
      toBottom(2, false);
    } else if (n === 3) {
      instant(() => commit(at3(2, false)));
      if (!s.listShown) toBottom(3, false);
    } else {
      const patch: Partial<LoopState> = {};
      if (s.reminderIndex < 0) patch.reminderIndex = 0;
      if (s.cardOpened && s.revisitFilled < 3) patch.revisitFilled = 3;
      if (Object.keys(patch).length) instant(() => commit(patch));
    }
    complete.current.add(n);
  };

  const stopIntro = (finish = true) => {
    const n = introStep.current;
    if (!intro.running && n === null) return;
    intro.stop();
    introStep.current = null;
    if (n !== null && finish) finalState(n);
  };

  const cancelAll = () => {
    timers.current.forEach((id) => clearTimeout(id));
    timers.current.clear();
    stopIntro();
    flyRef.current?.classList.remove('go');
    const s = sRef.current;
    const patch: Partial<LoopState> = {};
    if (s.busy) patch.busy = false;
    if (s.blank.status !== 'empty' && !s.resultShown) patch.resultShown = true;
    if (s.cardOpened && s.revisitFilled < 3) patch.revisitFilled = 3;
    if (Object.keys(patch).length) commit(patch);
  };

  /* first-visit intros of steps 2-4 (DESIGN 5.5) */
  const seq2 = (): TimelineEvent[] => {
    const step = (n: number, extra?: Partial<LoopState>) => () => {
      commit({ ...at2(n), ...extra });
      toBottom(2, true);
    };
    return [
      { t: 0, fn: step(1, { busy: true, blank: EMPTY, blankPop: false, resultShown: false, resultFresh: false }) },
      { t: 250, fn: step(2) },
      { t: 600, fn: step(3) },
      { t: 950, fn: step(4, { busy: false }) },
      { t: 1400, fn: step(5) },
      { t: 2200, fn: step(6) },
    ];
  };

  const seq3 = (speed: number): TimelineEvent[] => [
    {
      t: 0,
      fn: () => {
        commit(at3(1));
        toBottom(3, false);
      },
    },
    { t: 450, fn: () => fly(speed) },
    {
      t: 860,
      fn: () => {
        commit(at3(2));
        toBottom(3, true);
      },
    },
  ];

  const seq4 = (): TimelineEvent[] => [
    { t: 0, fn: () => commit({ cardOpened: false, revisitFilled: 0, reminderIndex: -1 }) },
    { t: 120, fn: () => commit({ reminderIndex: 0 }) },
  ];

  const runIntro = (n: Step) => {
    if (n === 1 || reduced.current) {
      finalState(n);
      return;
    }
    introStep.current = n;
    const speed = n === 2 ? T.introSpeed[2] : n === 3 ? T.introSpeed[3] : 1;
    intro.start(n === 2 ? seq2() : n === 3 ? seq3(speed) : seq4(), {
      speed,
      onEnd: () => {
        introStep.current = null;
        complete.current.add(n);
      },
    });
  };

  const activate = (n: Step, o: { focus?: boolean } = {}) => {
    cancelAll();
    const s = sRef.current;
    commit({
      step: n,
      enter: s.step !== n ? n : s.enter,
      f2: s.at2,
      f3: s.at3,
      resultFresh: false,
      listFresh: false,
      blankPop: false,
    });
    if (o.focus) tabRefs.current[n - 1]?.focus();
    trackStep(n);
    say(fill(copy.live.tab, { n: String(n), name: copy.steps[n - 1].name }));
    if (!seen.current.has(n)) {
      seen.current.add(n);
      runIntro(n);
    } else if (!complete.current.has(n)) finalState(n);
  };

  /* step 2: fill the blank (DESIGN 5.6) */
  const choose = (option: string) => {
    cancelAll();
    const t = topicNow();
    const right = option === t.answer;
    commit({
      blank: right ? { status: 'right', choice: option } : { status: 'wrong', choice: option },
      blankRev: sRef.current.blankRev + 1,
      blankPop: true,
      resultShown: false,
      resultFresh: false,
    });
    later(
      () => {
        commit({ resultShown: true, resultFresh: true });
        toBottom(2, true);
        say(right ? t.right.live : t.wrong.live);
        if (right) complete.current.add(2);
      },
      reduced.current ? 0 : T.resultDelay,
    );
  };

  /* step 3: the visitor saves the card into the list */
  const save = () => {
    cancelAll();
    commit({ listShown: true, listFresh: true });
    const list = panel(3)?.querySelector<HTMLElement>('.xscroll');
    if (list) {
      list.scrollTop = 0;
      list.focus({ preventScroll: true });
    }
    say(shared.toast);
    complete.current.add(3);
  };

  /* step 4: reminders and the closing card (DESIGN 5.7) */
  const reminderLive = (i: number) =>
    fill(copy.live.reminder, { date: shared.reminderDates[i], label: copy.live.reminderLabels[i] });
  const focusFrontHit = () =>
    panel(4)?.querySelector<HTMLButtonElement>('.notif[data-off="0"] .n-hit:not([hidden])')?.focus();

  const openCard = (focusTitle: boolean) => {
    commit({ cardOpened: true, revisitFilled: reduced.current ? 3 : 0 });
    if (!reduced.current)
      ([1, 2, 3] as const).forEach((k) => later(() => commit({ revisitFilled: k }), T.dotStart + (k - 1) * T.dotGap));
    toTop(4);
    say(copy.live.opened);
    if (focusTitle) cardTitleRef.current?.focus({ preventScroll: true });
    complete.current.add(4);
  };

  const advance = (fromHit: boolean) => {
    cancelAll();
    const s = sRef.current;
    if (s.cardOpened) {
      commit({ cardOpened: false, revisitFilled: 0, reminderIndex: 0 });
      say(reminderLive(0));
      if (fromHit) focusFrontHit();
      return;
    }
    if (s.reminderIndex < 2) {
      const i = (s.reminderIndex + 1) as RIndex;
      commit({ reminderIndex: i });
      say(reminderLive(i));
      if (fromHit) focusFrontHit();
      return;
    }
    openCard(fromHit);
  };

  /* topic sets A/B/C (DESIGN 5.11) */
  const selectTopic = (id: TopicId) => {
    cancelAll();
    const s = sRef.current;
    const t = topics[id];
    instant(() => commit({ ...UNTOUCHED, topic: id, step: 1, enter: s.step !== 1 ? 1 : s.enter }));
    seen.current = new Set([1]);
    complete.current = new Set([1]);
    STEPS.forEach(toTop);
    trackStep(1);
    say(fill(copy.live.topic, { chip: t.chip }));
  };

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    let j: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % 4;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i + 3) % 4;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = 3;
    if (j === null) return;
    e.preventDefault();
    activate((j + 1) as Step, { focus: true });
  };

  // Listeners registered once call the latest closures through this ref.
  const api = useRef({ selectTopic, stopIntro, commit, trackStep, choose, advance, save });
  api.current = { selectTopic, stopIntro, commit, trackStep, choose, advance, save };
  const onChoose = useCallback((o: string) => api.current.choose(o), []);
  const onAdvance = useCallback((fromHit: boolean) => api.current.advance(fromHit), []);
  const onSave = useCallback(() => api.current.save(), []);
  const chips = useMemo(() => TOPIC_IDS.map((id) => ({ id, chip: topics[id].chip })), [topics]);

  useEffect(() => {
    const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
    const mqWide = matchMedia('(min-width: 1024px)');
    reduced.current = mqReduce.matches;
    const topic = topicFromHash(location.hash) ?? 'join';
    seen.current = new Set([1]);
    complete.current = new Set([1]);
    sRef.current = { ...sRef.current, ...UNTOUCHED, topic, ready: true, vertical: mqWide.matches };
    setState(sRef.current);

    const onReduce = (e: MediaQueryListEvent) => {
      reduced.current = e.matches;
      if (e.matches) api.current.stopIntro();
    };
    const onWide = (e: MediaQueryListEvent) => api.current.commit({ vertical: e.matches });
    const onHash = () => {
      const id = topicFromHash(location.hash);
      if (!id) return;
      const lp = lastPick.current;
      if (lp && lp.topic === id && performance.now() - lp.at < 1500) return;
      api.current.selectTopic(id);
    };
    const onClick = (e: MouseEvent) => {
      const el = e.target instanceof Element ? e.target.closest('a[data-topic]') : null;
      const id = el?.getAttribute('data-topic');
      if (!isTopic(id)) return;
      lastPick.current = { topic: id, at: performance.now() };
      api.current.selectTopic(id);
    };
    mqReduce.addEventListener('change', onReduce);
    mqWide.addEventListener('change', onWide);
    window.addEventListener('hashchange', onHash);
    document.addEventListener('click', onClick, true);

    // Step 1 counts as opened once the stage fills half the screen (or half of itself) for a second,
    // so scrolling past it on the way to #signup is not counted.
    let io: IntersectionObserver | null = null;
    let dwell = 0;
    if (stageRef.current && 'IntersectionObserver' in window) {
      io = new IntersectionObserver(
        (entries) => {
          const en = entries[entries.length - 1];
          const vh = en.rootBounds?.height ?? innerHeight;
          const inView = en.intersectionRect.height >= Math.min(en.boundingClientRect.height, vh) / 2;
          if (inView && !dwell) {
            dwell = window.setTimeout(() => {
              api.current.trackStep(1);
              io?.disconnect();
            }, T.seenMs);
          } else if (!inView && dwell) {
            clearTimeout(dwell);
            dwell = 0;
          }
        },
        { threshold: Array.from({ length: 21 }, (_, i) => i / 20) },
      );
      io.observe(stageRef.current);
    }

    const pending = timers.current;
    return () => {
      mqReduce.removeEventListener('change', onReduce);
      mqWide.removeEventListener('change', onWide);
      window.removeEventListener('hashchange', onHash);
      document.removeEventListener('click', onClick, true);
      io?.disconnect();
      clearTimeout(dwell);
      pending.forEach((id) => clearTimeout(id));
      pending.clear();
    };
  }, [topics]);

  /* render */
  const s = state;
  const topic = topics[s.topic];
  const cur = s.reminderIndex < 0 ? 0 : T.remindDays[s.reminderIndex];
  const markOn = (d: number) =>
    d === 0 || (d === 1 && s.reminderIndex >= 1) || (d === 7 && s.reminderIndex >= 2) || (d === 30 && s.cardOpened);
  const solved = s.blank.status === 'right' && s.resultShown;
  const remindLabel = s.cardOpened ? copy.remind.restart : s.reminderIndex >= 2 ? copy.remind.open : copy.remind.next;
  const saved = s.step === 4 || (s.step === 3 && s.listShown);
  const nav: NavId = s.step === 4 ? (s.cardOpened ? 'cards' : 'remind') : s.step === 3 ? 'cards' : 'study';
  const winTitle =
    s.step === 4
      ? s.cardOpened
        ? shared.openedTitle
        : shared.nav.remind
      : s.step === 3 && s.listShown
        ? shared.listTitle
        : topic.question;

  return (
    <>
      <div className="how-topics">
        <span className="how-topics-k" id="how-topics-k">
          {copy.topicsLabel}
        </span>
        <ul aria-labelledby="how-topics-k">
          {chips.map((c) => (
            <li key={c.id}>
              <a href={`#how-${c.id}`} data-topic={c.id} aria-current={s.topic === c.id ? 'true' : undefined}>
                {c.chip}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="how-anchors" aria-hidden="true">
        {TOPIC_IDS.map((id) => (
          <span key={id} id={`how-${id}`} />
        ))}
      </div>
      <div id="stage" className="stage mock" ref={stageRef} data-step={s.step} data-ready={s.ready ? '' : undefined}>
        <div className="tints" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>
        <AppWindow
          shared={shared}
          title={winTitle}
          active={nav}
          count={cardsBefore + (saved ? 1 : 0)}
          bump={s.step === 3 && s.listFresh}
        />
        <div className="ctrl">
          <div
            className="steps"
            role="tablist"
            aria-label={copy.tablistLabel}
            aria-orientation={s.vertical ? 'vertical' : 'horizontal'}
          >
            {STEPS.map((n, i) => {
              const on = s.step === n;
              return (
                <button
                  key={n}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`loop-tab-${n}`}
                  aria-controls={`loop-panel-${n}`}
                  aria-selected={on}
                  tabIndex={on ? 0 : -1}
                  className="step-tab"
                  onClick={() => activate(n)}
                  onKeyDown={(e) => onTabKey(e, i)}
                >
                  <span className="st-num" aria-hidden="true">
                    {n}
                  </span>
                  <span className="st-text">
                    <span className="st-when">{copy.steps[i].when}</span>
                    <span className="st-name">{copy.steps[i].name}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="panels">
            {STEPS.map((n, i) => {
              const c = copy.steps[i];
              return (
                <div
                  key={n}
                  ref={(el) => {
                    panelRefs.current[i] = el;
                  }}
                  className={s.enter === n ? 'panel enter' : 'panel'}
                  id={`loop-panel-${n}`}
                  data-step={n}
                  role={s.ready ? 'tabpanel' : undefined}
                  aria-labelledby={s.ready ? `loop-tab-${n}` : undefined}
                  hidden={s.ready ? s.step !== n : undefined}
                >
                  <div className="detail">
                    <h3 className="nj">
                      <small>{c.when}</small>
                      {n} {c.name}
                    </h3>
                    <p className="two">
                      <RichText parts={c.detail} />
                      {n === 4 ? (
                        <>
                          {' '}
                          <span className="soon">{copy.remind.soon}</span>
                        </>
                      ) : null}
                    </p>
                  </div>
                  {n === 1 ? (
                    <ChatMock topic={topic} shared={shared} threadLabel={copy.threads.chat} />
                  ) : n === 2 ? (
                    <TaskMock
                      topic={topic}
                      shared={shared}
                      threadLabel={copy.threads.task}
                      at={s.at2}
                      fresh={s.f2}
                      busy={s.busy}
                      blank={s.blank}
                      blankRev={s.blankRev}
                      blankPop={s.blankPop}
                      resultShown={s.resultShown}
                      resultFresh={s.resultFresh}
                      onChoose={onChoose}
                    />
                  ) : n === 3 ? (
                    <CardMock
                      topic={topic}
                      shared={shared}
                      chatLabel={copy.threads.card}
                      listLabel={copy.threads.list}
                      at={s.at3}
                      fresh={s.f3}
                      listShown={s.listShown}
                      listFresh={s.listFresh}
                      flyRef={flyRef}
                      onSave={onSave}
                    />
                  ) : (
                    <ReminderMock
                      topic={topic}
                      shared={shared}
                      remind={copy.remind}
                      threadLabel={copy.threads.opened}
                      ready={s.ready}
                      index={s.reminderIndex}
                      opened={s.cardOpened}
                      revisitFilled={s.revisitFilled}
                      onAdvance={onAdvance}
                      cardTitleRef={cardTitleRef}
                    />
                  )}
                  {/* after the screen in DOM so focus goes tabs, app screen, then the next-step action */}
                  <div className="act">
                    {n === 2 && !solved ? (
                      <p className="hint">{topic.hint}</p>
                    ) : n === 4 ? (
                      <button type="button" className="pill-btn dark btn-notif" onClick={() => advance(false)}>
                        {remindLabel}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="pill-btn next-step"
                        onClick={() => activate((n + 1) as Step, { focus: true })}
                      >
                        {c.next}
                      </button>
                    )}
                  </div>
                  {n === 4 ? (
                    <div className="r4">
                      <div className="ruler" aria-hidden="true" style={{ '--cur': cur } as CSSProperties}>
                        <div className="ru-track">
                          <i className="ru-ticks" />
                          <i className="ru-base" />
                          <i className="ru-fill" />
                          {[0, 1, 7, 30].map((d) => (
                            <i key={d} className={markOn(d) ? 'ru-mark on' : 'ru-mark'} data-d={d} />
                          ))}
                          <span className="ru-clip">
                            <span className="ru-pos">
                              <i className="ru-pin" />
                            </span>
                          </span>
                        </div>
                        <div className="ru-ends">
                          <span>{copy.remind.rulerStart}</span>
                          <span>{copy.remind.rulerEnd}</span>
                        </div>
                      </div>
                      <p className="fact">{copy.remind.fact}</p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
        <p id="loop-live" className="sr-only" aria-live="polite">
          {s.live}
        </p>
      </div>
    </>
  );
}
