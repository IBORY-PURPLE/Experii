import { download } from '@/content/landing';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/sections/Footer';
import { DownloadNote } from '@/components/download/DownloadNote';
import '@/components/docs/docs.css';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader onDocs />
      {children}
      <Footer />
      <DownloadNote copy={download} signupHref="/#signup" />
    </>
  );
}
