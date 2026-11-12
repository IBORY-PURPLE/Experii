import type { MetadataRoute } from 'next';

// An invite-only experiment: nothing here is for search engines.
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', disallow: '/' }] };
}
