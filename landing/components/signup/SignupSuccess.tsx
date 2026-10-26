'use client';

import { useEffect, useRef } from 'react';
import { signup } from '@/content/landing';

export function SignupSuccess() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <div className="su-done" ref={ref} tabIndex={-1} role="status">
      <p className="done-h">{signup.done.title}</p>
      <p>{signup.done.body}</p>
    </div>
  );
}
