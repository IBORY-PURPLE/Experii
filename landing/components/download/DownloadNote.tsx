'use client';

import { useEffect, useRef } from 'react';
import type { download as DownloadCopy } from '@/content/landing';
import { NOTE_ID } from './Download';

export function DownloadNote({ copy }: { copy: typeof DownloadCopy }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onToggle = (e: Event) => {
      if ((e as ToggleEvent).newState === 'open') el.querySelector<HTMLElement>('[data-download-signup]')?.focus();
    };
    el.addEventListener('toggle', onToggle);
    return () => el.removeEventListener('toggle', onToggle);
  }, []);

  const toSignup = () => {
    ref.current?.hidePopover();
    // the link scrolls to #signup on its own; the email field takes focus without a second jump
    requestAnimationFrame(() => document.getElementById('f-email')?.focus({ preventScroll: true }));
  };

  return (
    <div
      ref={ref}
      id={NOTE_ID}
      popover="auto"
      role="dialog"
      aria-labelledby="download-note-t"
      aria-describedby="download-note-d"
      className="dl-note"
    >
      <p id="download-note-t" className="dl-note-t">
        {copy.noteTitle}
      </p>
      <p id="download-note-d" className="dl-note-d">
        {copy.noteBody}
      </p>
      <div className="dl-note-act">
        <a className="btn btn-ink" href="#signup" data-download-signup="" data-cta="download" onClick={toSignup}>
          {copy.signup}
        </a>
        <button type="button" className="btn btn-soft" popoverTarget={NOTE_ID} popoverTargetAction="hide">
          {copy.close}
        </button>
      </div>
    </div>
  );
}
