import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Loaded by ScrollReveal after the first scroll, key or click. Nothing is hidden before this runs, so a late or failed load leaves the page whole.
const REVEAL = {
  y: 30, // px
  duration: 0.8, // s
  ease: 'power4.out',
  stagger: 0.07, // s
  start: 'clamp(top 82%)', // "clamp" also fires for elements at the very end of the page
  gather: 0.06, // s: elements that pass the line within this window appear together
  stuck: 2000, // ms: a held-back element in view this long is shown anyway
} as const;

const CLEAR = 'opacity,transform';

const onScreen = (el: Element) => {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < innerHeight;
};

let used = false;

// Returns a function that stops everything and leaves all content shown.
export function startScrollReveal(): () => void {
  const root = document.documentElement;
  // what is already on screen or above is left alone
  const targets = [...document.querySelectorAll<HTMLElement>('[data-reveal]')].filter(
    (el) => el.getBoundingClientRect().top >= innerHeight,
  );
  if (used || !targets.length) {
    root.dataset.motion = 'done';
    return () => {};
  }
  used = true;

  const waiting = new Set<Element>(targets);
  const stuck = new Map<Element, number>();
  let running = 0;
  let over = false;
  let ctx: gsap.Context | undefined;
  let net: IntersectionObserver | undefined;

  // the targets carry no inline style of their own
  const showNow = (els: Iterable<Element>) => [...els].forEach((el) => el.removeAttribute('style'));

  const stop = () => {
    if (over) return;
    over = true;
    document.removeEventListener('focusin', onFocus);
    net?.disconnect();
    stuck.forEach((id) => clearTimeout(id));
    try {
      ctx?.revert();
      if (!ScrollTrigger.getAll().length) {
        ScrollTrigger.disable();
        // GSAP's ticker idles for about 2s after its last tween
        if (!gsap.globalTimeline.getChildren(false, true, true).length) gsap.ticker.sleep();
      }
    } catch {
      showNow(targets);
    }
    // ScrollTrigger leaves its own scroll-behavior on <html>, which would outlive the stylesheet's reduced-motion guard
    root.style.removeProperty('scroll-behavior');
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
          stagger: instant ? 0 : REVEAL.stagger,
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

  // a control reached by keyboard must not stay invisible, even where the browser does not scroll to it
  const onFocus = (e: FocusEvent) => {
    const el = (e.target as Element).closest?.('[data-reveal]');
    if (el) play([el], true);
  };

  try {
    gsap.registerPlugin(ScrollTrigger);

    // safety net for stale trigger positions: an element in view that its trigger never showed
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
    document.addEventListener('focusin', onFocus);

    root.dataset.motion = 'on';
  } catch {
    stop();
    showNow(targets);
  }

  return stop;
}
