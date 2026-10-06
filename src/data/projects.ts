/**
 * SAMPLE DATA — replace with your own projects.
 * Each project becomes a "Projects" row on the timeline and a /timeline/<slug> page.
 */
export type Project = {
  slug: string;
  title: string;
  /** Shorter label used in the timeline table. */
  shortTitle?: string;
  year: string;
  tag: string;
  blurb: string;
  external?: { label: string; href: string }[];
  images?: string[];
  /** Full-width image shown at the top of the detail page gallery. */
  hero?: string;
  heroAlt?: string;
  location?: string;
};

export const projects: Project[] = [
  {
    slug: 'project-one',
    title: 'Project One — an open-source tool',
    shortTitle: 'Project One',
    year: '2025',
    tag: 'Open-source tool',
    blurb: 'A small command-line tool that solves an everyday problem. Describe what it does in one sentence.',
    external: [
      { label: 'example.com', href: 'https://example.com' },
      { label: 'Source code', href: 'https://example.org' },
    ],
    hero: '/projects/project-one/hero.jpg',
    heroAlt: 'Placeholder project screenshot',
    images: ['/projects/project-one/detail.jpg'],
    location: 'Remote',
  },
  {
    slug: 'project-two',
    title: 'Project Two — a research write-up',
    shortTitle: 'Project Two',
    year: '2022',
    tag: 'Research',
    blurb: 'A short study or experiment, with the question you asked and what you found.',
    external: [{ label: 'Read the paper', href: 'https://example.com' }],
    location: 'City, Country',
  },
];
