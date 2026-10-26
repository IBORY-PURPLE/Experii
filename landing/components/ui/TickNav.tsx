'use client';

import { useEffect, useState } from 'react';

type Item = { readonly href: string; readonly label: string };

export function TickNav({ items, label }: { items: readonly Item[]; label: string }) {
  const [current, setCurrent] = useState(items[0]?.href);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setCurrent(`#${e.target.id}`);
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    for (const item of items) {
      const el = document.getElementById(item.href.slice(1));
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [items]);

  return (
    <nav className="ticks" aria-label={label}>
      {items.map((item) => (
        <a key={item.href} href={item.href} aria-current={current === item.href ? 'true' : undefined}>
          <i />
          <span>{item.label}</span>
        </a>
      ))}
    </nav>
  );
}
