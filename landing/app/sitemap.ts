import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { docGroups } from '@/content/docs';

export default function sitemap(): MetadataRoute.Sitemap {
  const docs = docGroups.flatMap((g) => g.slugs).map((slug) => ({ url: `${SITE_URL}/docs/${slug}` }));
  return [{ url: `${SITE_URL}/` }, ...docs, { url: `${SITE_URL}/privacy` }];
}
