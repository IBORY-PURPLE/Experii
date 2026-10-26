import { UMAMI_SRC } from '@/lib/umami';

// Runs once the page's JS has loaded and before React hydrates, as the next/script tags in app/layout.tsx
// used to, without the next/script runtime in the first load (TSD 12).

// The stylesheets switch to the interactive layout on this class, so without JS the static layout stays.
document.documentElement.classList.add('js');

// In-page links scroll smoothly, but the browser's own jump to a deep link's #fragment on load does not:
// smooth scrolling switches on with the visitor's first press.
const smooth = () => document.documentElement.classList.add('smooth');
addEventListener('pointerdown', smooth, { once: true, capture: true });
addEventListener('keydown', smooth, { once: true, capture: true });

// Umami (only where its ID is set, TSD 9.2) is added when the main thread goes idle after hydration.
const umamiId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
if (umamiId) {
  const load = () => {
    const s = document.createElement('script');
    s.src = UMAMI_SRC;
    s.dataset.websiteId = umamiId;
    document.head.append(s);
  };
  if ('requestIdleCallback' in window) requestIdleCallback(load);
  else setTimeout(load);
}
