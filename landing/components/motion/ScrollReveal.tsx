'use client';

import { useEffect } from 'react';

// GSAP is fetched after the visitor's first scroll, key or click, so a page nobody scrolls loads none of it.
export function ScrollReveal() {
  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    if (reduce.matches || !('IntersectionObserver' in window)) return;

    let stop: (() => void) | undefined;
    let cancel = () => {};
    let alive = true;
    // only the page's own scroll: scroll events of inner panes do not bubble to the document
    const intents: [EventTarget, string, boolean][] = [
      [document, 'scroll', false],
      [window, 'wheel', true],
      [window, 'keydown', true],
      [window, 'pointerdown', true],
    ];

    const load = () => {
      import('./scroll-reveal').then(
        (m) => {
          if (alive && !reduce.matches) stop = m.startScrollReveal();
        },
        () => {},
      );
    };
    const later = () => {
      for (const [target, type, capture] of intents) target.removeEventListener(type, later, capture);
      if ('requestIdleCallback' in window) {
        const id = requestIdleCallback(load, { timeout: 500 });
        cancel = () => cancelIdleCallback(id);
      } else {
        const id = setTimeout(load, 100);
        cancel = () => clearTimeout(id);
      }
    };
    const onChange = () => reduce.matches && stop?.();

    reduce.addEventListener('change', onChange);
    for (const [target, type, capture] of intents) target.addEventListener(type, later, { capture, passive: true });

    return () => {
      alive = false;
      reduce.removeEventListener('change', onChange);
      for (const [target, type, capture] of intents) target.removeEventListener(type, later, capture);
      cancel();
      stop?.();
    };
  }, []);

  return null;
}
