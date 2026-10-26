'use client';

import { useEffect, useMemo, useRef } from 'react';

export interface TimelineEvent {
  t: number;
  fn?: () => void;
  dur?: number;
  frame?: (progress: number) => void;
}

export interface TimelineOptions {
  speed?: number;
  total?: number;
  onTick?: (elapsed: number) => void;
  onEnd?: () => void;
}

export interface Timeline {
  play(): void;
  pause(): void;
  stop(): void;
  readonly playing: boolean;
  readonly done: boolean;
}

// A frame gap longer than this (throttled or hidden tab) is not counted as elapsed time,
// so overdue events do not all fire at once when the page comes back.
const MAX_FRAME_GAP = 120;

export function createTimeline(events: TimelineEvent[], opts: TimelineOptions = {}): Timeline {
  const speed = opts.speed ?? 1;
  const ev = events.slice().sort((a, b) => a.t - b.t);
  const total = opts.total ?? ev.reduce((m, e) => Math.max(m, e.t + (e.dur ?? 0)), 0);
  const active = new Set<TimelineEvent>();
  let elapsed = 0;
  let last = 0;
  let raf = 0;
  let i = 0;
  let playing = false;
  let done = false;

  const step = (ts: number) => {
    if (!playing) return;
    const gap = Math.min(Math.max(0, ts - last), MAX_FRAME_GAP);
    last = ts;
    elapsed += gap * speed;
    while (playing && i < ev.length && ev[i].t <= elapsed) {
      const e = ev[i++];
      e.fn?.();
      if (e.dur && e.frame) active.add(e);
    }
    if (!playing) return;
    active.forEach((e) => {
      const p = Math.min(1, Math.max(0, (elapsed - e.t) / (e.dur ?? 1)));
      e.frame?.(p);
      if (p >= 1) active.delete(e);
    });
    opts.onTick?.(Math.min(elapsed, total));
    if (elapsed >= total && i >= ev.length && active.size === 0) {
      playing = false;
      done = true;
      opts.onEnd?.();
      return;
    }
    raf = requestAnimationFrame(step);
  };

  return {
    play() {
      if (playing || done) return;
      playing = true;
      last = performance.now();
      raf = requestAnimationFrame(step);
    },
    pause() {
      if (!playing) return;
      playing = false;
      cancelAnimationFrame(raf);
    },
    stop() {
      playing = false;
      done = true;
      active.clear();
      cancelAnimationFrame(raf);
    },
    get playing() {
      return playing;
    },
    get done() {
      return done;
    },
  };
}

export interface TimelineHandle {
  start(events: TimelineEvent[], opts?: TimelineOptions): void;
  play(): void;
  pause(): void;
  stop(): void;
  readonly running: boolean;
  readonly playing: boolean;
}

// One rAF clock at a time; stopped on unmount.
export function useTimeline(): TimelineHandle {
  const ref = useRef<Timeline | null>(null);
  useEffect(
    () => () => {
      ref.current?.stop();
      ref.current = null;
    },
    [],
  );
  return useMemo<TimelineHandle>(
    () => ({
      start(events, opts = {}) {
        ref.current?.stop();
        const tl = createTimeline(events, {
          ...opts,
          onEnd: () => {
            if (ref.current === tl) ref.current = null;
            opts.onEnd?.();
          },
        });
        ref.current = tl;
        tl.play();
      },
      play() {
        ref.current?.play();
      },
      pause() {
        ref.current?.pause();
      },
      stop() {
        ref.current?.stop();
        ref.current = null;
      },
      get running() {
        return ref.current !== null;
      },
      get playing() {
        return ref.current?.playing ?? false;
      },
    }),
    [],
  );
}
