import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Scroll-in motion for every [data-reveal] element (DESIGN 3.4, "reveal"). ScrollReveal.tsx loads this module
// after the page is interactive, so GSAP stays out of the first-load JS (TSD 12).
//
// Nothing is hidden until this code runs: a script that loads late, or never, leaves the page whole. Elements
// that are already on screen or above it (a deep link, a restored scroll position) are never hidden. If anything
// here throws, every element is shown at once.

// The numbers to tune.
export const REVEAL = {
  y: 30, // px the element starts below its place
  duration: 0.8, // s
  ease: 'power4.out',
  stagger: 0.07, // s between elements that appear together
  spread: 0.35, // s: the most those gaps add up to, however many appear together
  start: 'clamp(top 82%)', // plays once the element's top passes 82% of the screen height ("clamp": also at the page's end)
  gather: 0.06, // s: elements that pass that line within this window appear together
  stuck: 2000, // ms: safety net, an element past the line that is still hidden after this long is shown at once
} as const;

const CLEAR = 'opacity,transform';

const onScreen = (el: Element) => {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < innerHeight;
};

let registered = false;
let disabled = false;

// Returns a function that stops everything and leaves all content shown.
export function startScrollReveal(): () => void {
  const root = document.documentElement;
  const targets = [...document.querySelectorAll<HTMLElement>('[data-reveal]')].filter(
    (el) => el.getBoundingClientRect().top >= innerHeight,
  );
  if (!targets.length) {
    root.dataset.motion = 'done';
    return () => {};
  }

  const waiting = new Set<Element>(targets);
  const stuck = new Map<Element, number>();
  let running = 0;
  let over = false;
  let ctx: gsap.Context | undefined;
  let net: IntersectionObserver | undefined;

  // The last resort: the targets carry no inline style of their own, so removing it shows them as the page wrote them.
  const showNow = (els: Iterable<Element>) => [...els].forEach((el) => el.removeAttribute('style'));

  const stop = () => {
    if (over) return;
    over = true;
    net?.disconnect();
    stuck.forEach((id) => clearTimeout(id));
    try {
      ctx?.revert();
      if (!ScrollTrigger.getAll().length) {
        ScrollTrigger.disable();
        disabled = true;
        // GSAP's ticker idles on for about 2s after its last tween; stop it now, unless something else is animating
        if (!gsap.globalTimeline.getChildren(false, true, true).length) gsap.ticker.sleep();
      }
    } catch {
      showNow(targets);
    }
    root.dataset.motion = 'done';
  };

  const settle = () => {
    if (!waiting.size && !running) stop();
  };

  const play = (els: Element[], instant = false) => {
    if (over) return;
    const fresh = els.filter((el) => waiting.delete(el));
    fresh.forEach((el) => {
      clearTimeout(stuck.get(el));
      stuck.delete(el);
    });
    if (!fresh.length) return;
    running++;
    try {
      ctx!.add(() => {
        gsap.to(fresh, {
          opacity: 1,
          y: 0,
          duration: instant ? 0 : REVEAL.duration,
          ease: REVEAL.ease,
          stagger: instant ? 0 : Math.min(REVEAL.stagger, REVEAL.spread / Math.max(1, fresh.length - 1)),
          clearProps: CLEAR,
          onComplete: () => {
            running--;
            settle();
          },
        });
      });
    } catch {
      running--;
      showNow(fresh);
      settle();
    }
  };

  try {
    if (!registered) {
      gsap.registerPlugin(ScrollTrigger);
      registered = true;
    } else if (disabled) {
      ScrollTrigger.enable();
    }
    disabled = false;

    // An element past the line that ScrollTrigger has not shown within `stuck` ms (stale positions, a trigger that
    // never fired) is shown anyway, so a hidden element can never stay hidden in view.
    net = new IntersectionObserver(
      (entries) => {
        for (const { target, isIntersecting } of entries) {
          if (!waiting.has(target)) continue;
          if (isIntersecting && !stuck.has(target)) {
            stuck.set(target, window.setTimeout(() => play([target], true), REVEAL.stuck));
          } else if (!isIntersecting && stuck.has(target)) {
            clearTimeout(stuck.get(target));
            stuck.delete(target);
          }
        }
      },
      { rootMargin: '0px 0px -18% 0px' },
    );

    ctx = gsap.context(() => {
      gsap.set(targets, { opacity: 0, y: REVEAL.y });
      ScrollTrigger.batch(targets, {
        start: REVEAL.start,
        interval: REVEAL.gather,
        onEnter: (els, triggers) => {
          triggers.forEach((t) => t.kill());
          // a jump past elements shows them at once; the ones on screen appear in turn
          play(els.filter((el) => !onScreen(el)), true);
          play(els.filter(onScreen));
        },
      });
    });
    targets.forEach((el) => net!.observe(el));

    root.dataset.motion = 'on';
    // Text reflows once the web font arrives, which moves every trigger line a little.
    document.fonts?.ready.then(() => over || ScrollTrigger.refresh());
  } catch {
    stop();
    showNow(targets);
  }

  return stop;
}
