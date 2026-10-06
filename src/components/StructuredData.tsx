import profiles from '@/data/social-previews.json';
import { headline } from '@/data/profile';
import { SHARE_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/seo';

export function StructuredData({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}

export function SiteStructuredData() {
  return <StructuredData data={{
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `${SITE_URL}/#person`,
        name: SITE_NAME,
        url: SITE_URL,
        image: `${SITE_URL}${SHARE_IMAGE.path}`,
        jobTitle: headline,
        sameAs: profiles.cards.map(profile => profile.profileUrl),
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        inLanguage: 'en-US',
        publisher: { '@id': `${SITE_URL}/#person` },
      },
    ],
  }} />;
}

export function ProfileStructuredData() {
  return <StructuredData data={{
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': `${SITE_URL}/about#profile`,
    url: `${SITE_URL}/about`,
    name: `About ${SITE_NAME}`,
    mainEntity: { '@id': `${SITE_URL}/#person` },
    isPartOf: { '@id': `${SITE_URL}/#website` },
  }} />;
}

export function DetailStructuredData({ title, path, description }: { title: string; path: string; description: string }) {
  return <StructuredData data={{
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}${path}#page`,
        url: `${SITE_URL}${path}`,
        name: `${title} — ${SITE_NAME}`,
        description,
        author: { '@id': `${SITE_URL}/#person` },
        isPartOf: { '@id': `${SITE_URL}/#website` },
        breadcrumb: { '@id': `${SITE_URL}${path}#breadcrumb` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${SITE_URL}${path}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Timeline', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: title, item: `${SITE_URL}${path}` },
        ],
      },
    ],
  }} />;
}
