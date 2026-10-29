import { download, header } from '@/content/landing';
import { docsUi } from '@/content/docs';
import { DownloadButton } from '@/components/download/Download';

// On /docs the brand and signup links leave the page; on / they stay as in-page anchors.
export function SiteHeader({ onDocs = false }: { onDocs?: boolean }) {
  return (
    <header className="nav">
      <div className={onDocs ? 'wrap wrap-wide nav-in' : 'wrap nav-in'}>
        <div className="nav-l">
          <a className="brand" href={onDocs ? '/' : '#top'}>
            {header.brand}
          </a>
          <nav className="nav-menu" aria-label={docsUi.menuLabel}>
            <a href="/docs/intro" aria-current={onDocs ? 'page' : undefined}>
              {docsUi.menu}
            </a>
          </nav>
        </div>
        <div className="nav-act">
          <a className="btn btn-soft btn-sm" href={onDocs ? '/#signup' : '#signup'} data-cta="nav">
            {header.cta}
          </a>
          <DownloadButton copy={download} location="nav" small />
        </div>
      </div>
    </header>
  );
}
