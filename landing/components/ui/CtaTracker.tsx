'use client';

import { useEffect } from 'react';
import { track } from '@/lib/analytics';
import type { HeroVariant } from '@/lib/signup-schema';

export function CtaTracker({ variant }: { variant: HeroVariant }) {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>('[data-cta]');
      if (el?.dataset.cta) track('cta_click', { location: el.dataset.cta, variant });
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [variant]);
  return null;
}
