'use client';

import './app-scoped.generated.css';
import './board-demo.css';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { HeroBoardCopy } from '@/content/loop';
import type { BoardDemoControl } from './board-demo-timeline';

// idle: never started (the still), playing, paused (the visitor's, or held because the window is off screen, the tab is hidden or
// reduced motion came on).
type Play = 'idle' | 'playing' | 'paused';

const VISIBLE = 0.35;

const WINDOW_W = 1427;

const Pause = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
    <rect x="2" y="1.5" width="2.8" height="9" rx="0.8" />
    <rect x="7.2" y="1.5" width="2.8" height="9" rx="0.8" />
  </svg>
);
const PlayMark = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
    <path d="M3 1.6v8.8a.6.6 0 0 0 .9.5l7-4.4a.6.6 0 0 0 0-1L3.9 1.1a.6.6 0 0 0-.9.5z" />
  </svg>
);

// The frame of the hero demo: the window (children, rendered on the server), the line that says what it is doing, the five steps and
// pause. data-step, data-play and data-loop on the root are what the tests (and anything that wants to know where the story is) read.
// The story itself (GSAP) is fetched when the window is on screen and the page is idle, and not at all under reduced motion until
// the visitor presses play.
export function BoardDemoPlayer({ copy, children }: { copy: HeroBoardCopy; children: ReactNode }) {
  const root = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);
  const [line, setLine] = useState(0);
  const [play, setPlay] = useState<Play>('idle');
  const act = useRef<{ press: () => void }>({ press: () => {} });

  useEffect(() => {
    const win = root.current?.querySelector<HTMLElement>('.bd-win');
    // the same expression the stylesheet uses: cqw is newer than the trigonometric functions in some browsers
    if (!win || CSS.supports('transform', 'scale(tan(atan2(100cqw, 1427px)))')) return;
    const box = win.parentElement!;
    const fit = () => win.style.setProperty('--bd-s', String(box.clientWidth / WINDOW_W));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const figure = root.current;
    const win = figure?.querySelector<HTMLElement>('.bd-win');
    const box = win?.parentElement;
    if (!figure || !win || !box) return;
    let alive = true;
    let ctl: BoardDemoControl | null = null;
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    // ready: the page is done loading and idle. visible: the window shows enough. userPaused: the visitor's pause (kept through
    // everything). reducePaused: reduced motion came on while it played. override: the visitor asked for play while the window is off
    // screen, until the window next changes. requested: play was asked for before the chunk came.
    const f = {
      loading: false,
      ready: false,
      visible: false,
      hidden: document.hidden,
      reduce: mq.matches,
      userPaused: false,
      reducePaused: false,
      override: false,
      requested: false,
    };

    const wants = () => !f.userPaused && !f.reducePaused && (f.override || (f.visible && !f.hidden));
    const sync = () => {
      if (!ctl) return;
      const run = wants();
      if (run) ctl.play();
      else ctl.pause();
      setPlay(run ? 'playing' : 'paused');
    };
    const start = () => {
      if (f.loading || ctl) return;
      f.loading = true;
      import('./board-demo-timeline').then(
        (m) => {
          if (!alive) return;
          ctl = m.createBoardDemo(
            win,
            {
              caption: (st, ln) => { setStep(st); setLine(ln); },
              loop: (n) => { figure.dataset.loop = String(n); },
            },
            copy.talk,
          );
          f.requested = false;
          sync();
        },
        () => {
          f.loading = false;
          if (f.requested) setPlay('idle');
          f.requested = false;
        },
      );
    };
    const maybeStart = () => {
      if (!f.reduce && f.ready && f.visible && !f.userPaused) start();
    };

    const io = new IntersectionObserver(
      (entries) => {
        f.visible = entries[entries.length - 1].intersectionRatio >= VISIBLE;
        f.override = false;
        if (ctl) sync();
        else maybeStart();
      },
      { threshold: [0, VISIBLE] },
    );
    io.observe(box);
    const onVisibility = () => {
      f.hidden = document.hidden;
      sync();
    };
    document.addEventListener('visibilitychange', onVisibility);
    // Reduced motion is read live: turning it on stops a story that plays, like the visitor's own pause; turning it off lets the
    // page start it again by the usual rule (a story the visitor paused stays paused).
    const onReduce = () => {
      f.reduce = mq.matches;
      if (f.reduce) {
        if (ctl || f.requested) {
          f.reducePaused = true;
          f.override = false;
          f.requested = false;
          setPlay('paused');
          sync();
        }
      } else {
        f.reducePaused = false;
        if (ctl) sync();
        else maybeStart();
      }
    };
    mq.addEventListener('change', onReduce);

    let cancelIdle = () => {};
    const whenIdle = () => {
      const ready = () => { f.ready = true; maybeStart(); };
      if ('requestIdleCallback' in window) {
        const id = requestIdleCallback(ready, { timeout: 1500 });
        cancelIdle = () => cancelIdleCallback(id);
      } else {
        const id = setTimeout(ready, 200);
        cancelIdle = () => clearTimeout(id);
      }
    };
    const onLoad = () => whenIdle();
    if (document.readyState === 'complete') whenIdle();
    else addEventListener('load', onLoad, { once: true });

    act.current.press = () => {
      const running = ctl ? wants() : f.requested && !f.userPaused;
      if (running) {
        f.userPaused = true;
        f.override = false;
        f.requested = false;
        setPlay('paused');
        sync();
        return;
      }
      f.userPaused = false;
      f.reducePaused = false;
      f.override = !f.visible || f.hidden;
      if (ctl) sync();
      else {
        f.requested = true;
        setPlay('playing');
        start();
      }
    };

    return () => {
      alive = false;
      cancelIdle();
      io.disconnect();
      removeEventListener('load', onLoad);
      document.removeEventListener('visibilitychange', onVisibility);
      mq.removeEventListener('change', onReduce);
      ctl?.kill();
      ctl = null;
      delete figure.dataset.loop;
      setPlay('idle');
      setStep(0);
      setLine(0);
    };
  }, [copy.talk]);

  const lines = copy.steps.flatMap((s, i) => s.lines.map((text) => ({ step: i, text })));
  const now = lines.findIndex((l) => l.step === step) + line;

  return (
    <figure
      ref={root}
      id="bd"
      className="bd"
      aria-label={copy.figureLabel}
      aria-describedby="bd-summary"
      data-step={copy.steps[step].id}
      data-play={play}
    >
      <p id="bd-summary" className="sr-only">
        {copy.summary}
      </p>
      <div className="bd-box" aria-hidden="true" data-nosnippet inert>
        {children}
      </div>
      <figcaption className="bd-cap">
        <p className="bd-now">
          <small className="bd-now-label">{copy.nowLabel}</small>
          <span className="bd-now-lines" aria-live="off">
            {lines.map((l, i) => (
              <b key={l.text} className="bd-now-text" data-on={i === now ? '' : undefined}>
                {l.text}
              </b>
            ))}
          </span>
        </p>
        <div className="bd-ctl">
          <ol className="bd-steps" aria-label={copy.stepsLabel}>
            {copy.steps.map((s, i) => (
              <li key={s.id} className={i < step ? 'done' : i === step ? 'on' : undefined} aria-current={i === step ? 'step' : undefined}>
                {s.name}
              </li>
            ))}
          </ol>
          <button type="button" className="bd-pause" aria-controls="bd" onClick={() => act.current.press()}>
            <i>{play === 'playing' ? <Pause /> : <PlayMark />}</i>
            <span>{copy.control[play]}</span>
          </button>
        </div>
      </figcaption>
    </figure>
  );
}
