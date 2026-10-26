import type { Metadata, Viewport } from 'next';
import { preload } from 'react-dom';
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './globals.css';
import { meta } from '@/content/landing';
import { SITE_URL, isProductionDeploy } from '@/lib/site';
import { UMAMI_SRC } from '@/lib/umami';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: meta.title,
  description: meta.description,
  openGraph: {
    type: 'website',
    siteName: 'Experii',
    locale: 'ko_KR',
    title: meta.title,
    description: meta.description,
  },
  twitter: { card: 'summary_large_image', title: meta.title, description: meta.description },
  robots: isProductionDeploy ? undefined : { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ffffff',
  colorScheme: 'light',
};

// The download popover opens without JS, so a click can land before hydration. A plain inline script runs
// as the HTML parses (instrumentation-client.ts waits for the Next runtime) and keeps it for takeEarlyDownloads.
const EARLY_DOWNLOADS = `(function(){var q=window.__earlyDownloads=[];document.addEventListener('click',function(e){var t=e.target,el=t&&t.closest&&t.closest('[data-download]');if(el&&window.__earlyDownloads===q)q.push(el.getAttribute('data-download'))},true)})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // instrumentation-client.ts adds the script itself once the page is interactive.
  if (process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID) preload(UMAMI_SRC, { as: 'script' });
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: EARLY_DOWNLOADS }} />
        {children}
      </body>
    </html>
  );
}
