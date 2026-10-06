import type { MetadataRoute } from 'next';
import { generatedDetailEntries } from '@/data/timeline';
import { SITE_URL } from '@/lib/seo';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '/', '/work', '/about', '/achievements',
    ...generatedDetailEntries.map((entry) => `/timeline/${entry.id}`),
  ];
  return routes.map((route) => ({ url: `${SITE_URL}${route}` }));
}
