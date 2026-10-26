import type { download as DownloadCopy } from '@/content/landing';

export const NOTE_ID = 'download-note';

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
