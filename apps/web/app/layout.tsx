import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/controls.css';
import './styles/panes.css';
import './styles/sidebar.css';
import './styles/tabs.css';
import './styles/note.css';
import './styles/chat.css';
import './styles/dialog.css';
import './styles/web.css';

export const metadata: Metadata = {
  title: 'Experii',
  description: 'AI와 대화하며 공부하고, 캡쳐를 붙이면 AI가 필기를 만들어 주는 공부 보드',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
