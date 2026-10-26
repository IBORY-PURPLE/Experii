import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './globals.css';
import { meta } from '@/content/landing';
import { SITE_URL, isProductionDeploy } from '@/lib/site';

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const umamiId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <Script id="js-flag" strategy="beforeInteractive">
          {"document.documentElement.classList.add('js')"}
        </Script>
        {children}
        {umamiId ? (
          <Script src="https://cloud.umami.is/script.js" data-website-id={umamiId} strategy="afterInteractive" />
        ) : null}
      </body>
    </html>
  );
}
