'use client';

import { useEffect } from 'react';
import { track } from '@/lib/analytics';
import type { HeroVariant } from '@/lib/signup-fields';

export function CtaTracker({ variant }: { variant: HeroVariant }) {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const dl = target?.closest<HTMLElement>('[data-download]');
      if (dl?.dataset.download) track('download_click', { location: dl.dataset.download, variant });
      const el = target?.closest<HTMLElement>('[data-cta]');
      if (el?.dataset.cta) track('cta_click', { location: el.dataset.cta, variant });
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [variant]);
  return null;
}
