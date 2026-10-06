import type { Metadata } from 'next';
import { fullName, headline } from '@/data/profile';

/** Your production origin, with no trailing slash. Used for canonical URLs, the sitemap and robots.txt. */
export const SITE_URL = 'https://www.example.com';
export const SITE_NAME = fullName;
export const SITE_DESCRIPTION = `${fullName}, ${headline}. A portfolio of experience, projects, education and side work.`;
/** Social sharing image, relative to /public. */
export const SHARE_IMAGE = { path: '/img/portrait.jpg', width: 600, height: 900 };
/** Your X/Twitter handle for twitter:creator, or leave empty. */
export const TWITTER_HANDLE = '@yourhandle';

export function pageMetadata({ title, description, path, type = 'website' }: {
  title: string;
  description: string;
  path: string;
  type?: 'website' | 'profile';
}): Metadata {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} — ${SITE_NAME}`;
  const image = `${SITE_URL}${SHARE_IMAGE.path}`;
  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: path },
    openGraph: {
      title: fullTitle,
      description,
      url: new URL(path, SITE_URL).href,
      siteName: SITE_NAME,
      locale: 'en_US',
      type,
      images: [{ url: image, width: SHARE_IMAGE.width, height: SHARE_IMAGE.height, alt: SITE_NAME }],
    },
    twitter: {
      card: 'summary',
      title: fullTitle,
      description,
      ...(TWITTER_HANDLE ? { creator: TWITTER_HANDLE } : {}),
      images: [{ url: image, alt: SITE_NAME }],
    },
  };
}
