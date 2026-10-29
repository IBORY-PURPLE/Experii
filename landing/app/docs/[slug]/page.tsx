import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { docGroups, docPages, docsUi } from '@/content/docs';
import { DocsNav } from '@/components/docs/DocsNav';
import { DocBody } from '@/components/docs/DocBody';

const order = docGroups.flatMap((g) => g.slugs);
const find = (slug: string) => docPages.find((p) => p.slug === slug);

export const dynamicParams = false;

export function generateStaticParams() {
  return order.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const page = find((await params).slug);
  if (!page) return {};
  return {
    title: `${page.title} · Experii 가이드`,
    description: page.description,
    alternates: { canonical: `/docs/${page.slug}` },
  };
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = find(slug);
  if (!page) notFound();
  const group = docGroups.find((g) => g.slugs.includes(slug))!;
  const i = order.indexOf(slug);
  const prev = i > 0 ? find(order[i - 1]) : undefined;
  const next = find(order[i + 1]);

  return (
    <div className="wrap wrap-wide docs">
      <details className="docs-mtoc">
        <summary>
          {docsUi.mobileToc} <span>{page.title}</span>
        </summary>
        <DocsNav current={slug} />
      </details>
      <aside className="docs-side">
        <DocsNav current={slug} />
      </aside>

      <main className="doc">
        <p className="doc-crumb">
          <a href="/docs/intro">{docsUi.crumbRoot}</a> › <span>{group.title}</span>
        </p>
        <h1>
          {page.title}
          {page.soon && <span className="soon">{docsUi.soon}</span>}
        </h1>
        <p className="doc-lead">{page.lead}</p>

        {page.sections.map((s) => (
          <section key={s.id} aria-labelledby={s.id}>
            <h2 id={s.id}>{s.heading}</h2>
            <DocBody blocks={s.blocks} />
          </section>
        ))}

        <div className="doc-cta">
          <p>{docsUi.callout}</p>
          <a className="btn btn-ink" href="/#signup" data-cta="docs">
            {docsUi.cta}
          </a>
        </div>

        <nav className="doc-pager" aria-label={docsUi.pagerLabel}>
          {prev && (
            <a href={`/docs/${prev.slug}`} rel="prev">
              <small>{docsUi.prev}</small>← {prev.title}
            </a>
          )}
          {next && (
            <a href={`/docs/${next.slug}`} rel="next" className="is-next">
              <small>{docsUi.next}</small>
              {next.title} →
            </a>
          )}
        </nav>
      </main>

      <aside className="docs-toc" aria-labelledby="docs-toc-t">
        <p id="docs-toc-t">{docsUi.toc}</p>
        <ul>
          {page.sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`}>{s.heading}</a>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
