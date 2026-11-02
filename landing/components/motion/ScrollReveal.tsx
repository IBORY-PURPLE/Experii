'use client';

import { useEffect } from 'react';

// Starts the scroll-in motion (scroll-reveal.ts: GSAP + ScrollTrigger) once the page has loaded and the main
// thread is idle. That module is its own chunk, so none of GSAP is in the first-load JS (TSD 12). It renders nothing.
// With "reduce motion" on, with no IntersectionObserver, or if the chunk fails to load, nothing is ever hidden.
export function ScrollReveal() {
  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    if (reduce.matches || !('IntersectionObserver' in window)) return;

    let stop: (() => void) | undefined;
    let cancel = () => {};
    let alive = true;

    const load = () => {
      import('./scroll-reveal').then(
        (m) => {
          if (alive && !reduce.matches) stop = m.startScrollReveal();
        },
        () => {},
      );
    };
    const later = () => {
      if ('requestIdleCallback' in window) {
        const id = requestIdleCallback(load, { timeout: 3000 });
        cancel = () => cancelIdleCallback(id);
      } else {
        const id = setTimeout(load, 300);
        cancel = () => clearTimeout(id);
      }
    };
    // switched to "reduce motion" while reading: everything shows at once
    const onChange = () => reduce.matches && stop?.();

    reduce.addEventListener('change', onChange);
    if (document.readyState === 'complete') later();
    else addEventListener('load', later, { once: true });

    return () => {
      alive = false;
      reduce.removeEventListener('change', onChange);
      removeEventListener('load', later);
      cancel();
      stop?.();
    };
  }, []);

  return null;
}
