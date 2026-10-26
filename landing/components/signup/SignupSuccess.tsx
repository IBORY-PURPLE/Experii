'use client';

import { useEffect, useRef } from 'react';
import type { signup } from '@/content/landing';

export function SignupSuccess({ copy }: { copy: (typeof signup)['done'] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <div className="su-done" ref={ref} tabIndex={-1} role="status">
      <p className="done-h">{copy.title}</p>
      <p>{copy.body}</p>
    </div>
  );
}
