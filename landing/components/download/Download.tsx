'use client';

import { useEffect, useRef } from 'react';
import type { download as DownloadCopy } from '@/content/landing';

const NOTE_ID = 'download-note';

// Fake-door test: there is no app to download yet. The button opens an honest notice (native popover,
// so it also works without JS, closes on Escape or an outside click and returns focus to the button).
export function DownloadButton({ copy, location, small }: { copy: typeof DownloadCopy; location: 'hero' | 'nav'; small?: boolean }) {
  return (
    <button
      type="button"
      className={small ? 'btn btn-ink btn-sm btn-dl' : 'btn btn-ink btn-dl'}
      popoverTarget={NOTE_ID}
      data-download={location}
    >
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
        <path d="M8 2.5v7.2M4.8 6.6 8 9.8l3.2-3.2M3 12.8h10" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {copy.label}
      <span className="dl-soon">{copy.soon}</span>
    </button>
  );
}

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
