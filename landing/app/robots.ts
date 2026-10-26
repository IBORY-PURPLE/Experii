import type { MetadataRoute } from 'next';
import { SITE_URL, isProductionDeploy } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  if (!isProductionDeploy) return { rules: { userAgent: '*', disallow: '/' } };
  return { rules: { userAgent: '*', allow: '/' }, sitemap: `${SITE_URL}/sitemap.xml` };
}
