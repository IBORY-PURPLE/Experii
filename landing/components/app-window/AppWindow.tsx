import type { ReactNode } from 'react';
import type { LoopShared } from '@/content/loop';
import './app-window.css';

export type NavId = 'study' | 'cards' | 'remind';

const NAV: NavId[] = ['study', 'cards', 'remind'];

const ICONS: Record<NavId, ReactNode> = {
  study: <path d="M3 4.6C3 3.7 3.7 3 4.6 3h6.8c.9 0 1.6.7 1.6 1.6v4.8c0 .9-.7 1.6-1.6 1.6H7.2L4.4 13v-2H4.6C3.7 11 3 10.3 3 9.4z" />,
  cards: (
    <>
      <rect x="2.5" y="3.5" width="11" height="9" rx="1.6" />
      <path d="M2.5 6.6h11" />
    </>
  ),
  remind: <path d="M4.6 10.6V7.2a3.4 3.4 0 0 1 6.8 0v3.4l1.1 1.4h-9zM6.8 13.4a1.3 1.3 0 0 0 2.4 0" />,
};

// The Experii desktop window both the hero autoplay and section 4 draw inside. Chrome is decorative;
// `tools` (real controls) sit in the title bar next to the badge and stay in the accessibility tree.
export function AppWindow({
  shared,
  title,
  active,
  count,
  bump,
  tools,
  className,
  mainClassName,
  children,
}: {
  shared: Pick<LoopShared, 'appName' | 'appIcon' | 'island' | 'subject' | 'nav'>;
  title: string;
  active: NavId;
  count: number;
  bump?: boolean;
  tools?: ReactNode;
  className?: string;
  mainClassName?: string;
  children?: ReactNode;
}) {
  return (
    <div className={className ? `aw ${className}` : 'aw'}>
      <div className="aw-bar">
        <i className="aw-ico" aria-hidden="true">
          {shared.appIcon}
        </i>
        <span className="aw-title" aria-hidden="true">
          {title}
        </span>
        {tools}
        <span className="ex aw-ex" aria-hidden="true">
          {shared.island}
        </span>
        <span className="aw-ctl" aria-hidden="true">
          <i data-c="min" />
          <i data-c="max" />
          <i data-c="close" />
        </span>
      </div>
      <div className="aw-side" aria-hidden="true">
        <b className="aw-brand">{shared.appName}</b>
        <span className="aw-subj">{shared.subject}</span>
        <ul className="aw-nav">
          {NAV.map((id) => (
            <li key={id} className={id === active ? 'on' : undefined}>
              <svg viewBox="0 0 16 16" aria-hidden="true">
                {ICONS[id]}
              </svg>
              {shared.nav[id]}
              {id === 'cards' ? (
                <span key={count} className={bump ? 'aw-count bump' : 'aw-count'}>
                  {count}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
      <div className={mainClassName ? `aw-main ${mainClassName}` : 'aw-main'}>{children}</div>
    </div>
  );
}
