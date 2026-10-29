import { docGroups, docPages, docsUi } from '@/content/docs';

export function DocsNav({ current }: { current: string }) {
  return (
    <nav className="docs-nav" aria-label={docsUi.sidebarLabel}>
      {docGroups.map((g) => (
        <div key={g.title} className="docs-nav-g">
          <p className="docs-nav-t">{g.title}</p>
          <ul>
            {g.slugs.map((slug) => {
              const page = docPages.find((p) => p.slug === slug)!;
              return (
                <li key={slug}>
                  <a href={`/docs/${slug}`} aria-current={slug === current ? 'page' : undefined}>
                    <span>{page.title}</span>
                    {page.soon ? <span className="soon">{docsUi.soon}</span> : page.color ? <i className={`docs-dot is-${page.color}`} aria-hidden="true" /> : null}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
