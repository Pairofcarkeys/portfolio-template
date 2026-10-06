import { projects } from './projects';

/**
 * SAMPLE DATA — replace every entry with your own.
 * Rename or relabel the four categories in CATEGORIES to suit you.
 */
export type TimelineCategory = 'experience' | 'projects' | 'education' | 'activities';

export type TimelineEntry = {
  id: string;
  category: TimelineCategory;
  /** Primary line — the institution or company. */
  title: string;
  /** Two or three short facts, starting with the role or title. */
  bullets: [string, string, string?];
  /** Entry location, or 'Location not listed'. */
  location: string;
  /** Secondary line — role, programme, or project framing. */
  subtitle?: string;
  /** Human-facing date range. */
  dateLabel: string;
  /** Decimal year the entry began; drives chronological ordering. */
  start: number;
  /** Overrides `start` for ordering only. */
  sortKey?: number;
  /** Decimal year the entry closed; null means ongoing. */
  end: number | null;
  /** Path under /public. Entries without one show no mark. */
  logo?: string;
  /** Optional video for the entry's detail page. */
  video?: string;
  videoPoster?: string;
  href?: string;
};

export const CATEGORIES: { id: TimelineCategory; label: string }[] = [
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'education', label: 'Education' },
  { id: 'activities', label: 'Activities' },
];

const entries: TimelineEntry[] = [
  {
    id: 'your-company',
    category: 'experience',
    title: 'Your Company',
    subtitle: 'Co-founder',
    bullets: [
      'Co-founder',
      'Describe what the company does in one plain sentence.',
      'Add one concrete result: users, revenue, a launch, a milestone.',
    ],
    location: 'City, Country',
    dateLabel: '2024 — Now',
    start: 2024,
    end: null,
    logo: '/logos/your-company.svg',
  },
  {
    id: 'example-corp',
    category: 'experience',
    title: 'Example Corp',
    subtitle: 'Software Engineer',
    bullets: [
      'Software Engineer',
      'Built and maintained the internal tools a team of fifty relied on.',
    ],
    location: 'City, Country',
    dateLabel: '2022 — 2024',
    start: 2022,
    end: 2024,
  },
  {
    id: 'sample-studio',
    category: 'experience',
    title: 'Sample Studio',
    subtitle: 'Design Intern',
    bullets: [
      'Design Intern',
      'Helped design and ship marketing sites for small clients.',
    ],
    location: 'City, Country',
    dateLabel: 'Summer 2021',
    start: 2021.5,
    end: 2021.75,
  },
  {
    id: 'example-university',
    category: 'education',
    title: 'Example University',
    subtitle: 'B.S. Computer Science',
    bullets: [
      'B.S. Computer Science',
      'Coursework in systems, design and human–computer interaction.',
    ],
    location: 'City, Country',
    dateLabel: '2018 — 2022',
    start: 2018,
    end: 2022,
  },
  {
    id: 'example-high-school',
    category: 'education',
    title: 'Example High School',
    subtitle: 'High school diploma',
    bullets: [
      'High school diploma',
      'Science club, school newspaper and the robotics team.',
    ],
    location: 'City, Country',
    dateLabel: '2014 — 2018',
    start: 2014,
    end: 2018,
  },
  {
    id: 'city-sports-club',
    category: 'activities',
    title: 'City Sports Club',
    subtitle: 'Team captain',
    bullets: [
      'Team captain',
      'Captained the club team through a regional championship season.',
    ],
    location: 'City, Country',
    dateLabel: '2019 — 2022',
    start: 2019,
    end: 2022,
  },
  {
    id: 'volunteer-tutoring',
    category: 'activities',
    title: 'Community Tutoring',
    subtitle: 'Volunteer tutor',
    bullets: [
      'Volunteer tutor',
      'Tutored students in maths and programming every week.',
    ],
    location: 'Location not listed',
    dateLabel: '2017 — 2019',
    start: 2017,
    end: 2019,
  },
];

/** Projects come from projects.ts so each project page has a single source of truth. */
const projectEntries: TimelineEntry[] = projects.map((p) => {
  const year = Number.parseInt(p.year, 10);
  return {
    id: p.slug,
    category: 'projects' as const,
    title: p.shortTitle ?? p.title,
    subtitle: p.tag,
    bullets: [p.tag, p.blurb],
    location: p.location ?? 'Location not listed',
    dateLabel: p.year,
    start: Number.isNaN(year) ? 0 : year,
    end: Number.isNaN(year) ? null : year,
  };
});

/** Position on the timeline: the override when present, otherwise the start year. */
export function orderOf(entry: TimelineEntry): number {
  return entry.sortKey ?? entry.start;
}

/** Every entry is clickable and uses a generated /timeline/[id] detail page. Newest first. */
export const timeline: TimelineEntry[] = [...entries, ...projectEntries]
  .map((e) => ({ ...e, href: e.href ?? `/timeline/${e.id}` }))
  .sort((a, b) => orderOf(b) - orderOf(a));

/** Every route that gets a generated detail page. */
export const generatedDetailEntries: TimelineEntry[] = timeline;
