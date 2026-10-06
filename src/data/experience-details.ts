/**
 * SAMPLE DATA — the "What I did / What I learned / Skills" sections of every
 * /timeline/<id> page. Every timeline id needs an entry here.
 */
export type ExperienceDetail = {
  did: string;
  learned: string;
  skills: string[];
  references?: { label: string; href: string }[];
  /** Optional downloadable poster/PDF with a preview image. */
  poster?: { src: string; pdf: string; alt: string; caption: string };
};

export const experienceDetails: Record<string, ExperienceDetail> = {
  'your-company': {
    did: 'I co-founded Your Company to solve a problem I kept running into. I lead product and operations, and I wrote much of the first version myself. Replace this paragraph with two or three sentences about your role and its outcome.',
    learned: 'I learned how to turn a rough idea into something people use, and how much of a company is communication.',
    skills: ['Product', 'Operations', 'Full-stack development', 'Hiring'],
  },
  'example-corp': {
    did: 'I built and maintained internal tools for a team of around fifty people, from data pipelines to the dashboards they used every day.',
    learned: 'I learned to ship small, reversible changes and to measure whether they actually helped.',
    skills: ['TypeScript', 'PostgreSQL', 'Internal tools', 'Code review'],
  },
  'sample-studio': {
    did: 'I designed and built marketing sites for small clients, working from a brief to a launched page in a few weeks.',
    learned: 'I learned how to present design decisions and take feedback without losing the idea.',
    skills: ['Web design', 'Prototyping', 'Client communication'],
  },
  'example-university': {
    did: 'I studied computer science with a focus on systems and design, and worked on several team projects along the way.',
    learned: 'I learned the fundamentals, and how to teach myself whatever the fundamentals did not cover.',
    skills: ['Algorithms', 'Systems', 'Human–computer interaction'],
  },
  'example-high-school': {
    did: 'I joined the science club, wrote for the school newspaper and helped build the robotics team’s first competition robot.',
    learned: 'I learned that most projects are finished by the people who keep showing up.',
    skills: ['Writing', 'Robotics', 'Teamwork'],
  },
  'city-sports-club': {
    did: 'I captained the club team for three seasons, organising training and helping newer players settle in.',
    learned: 'I learned to prepare consistently and to take responsibility for my part in a team.',
    skills: ['Leadership', 'Discipline', 'Communication'],
  },
  'volunteer-tutoring': {
    did: 'I tutored students in maths and introductory programming once a week, shaping each session around what they wanted to improve.',
    learned: 'I learned that explaining something simply is the best test of whether I understand it.',
    skills: ['Teaching', 'Patience', 'Mentoring'],
  },
  'project-one': {
    did: 'I designed and built Project One, a small open-source tool that automates a tedious everyday task. It has a simple command-line interface, tests, and documentation.',
    learned: 'I learned how to scope a project so it actually ships, and how to write documentation people read.',
    skills: ['TypeScript', 'CLI design', 'Open source', 'Documentation'],
  },
  'project-two': {
    did: 'I ran a short research study, collected the data, analysed it and wrote up the results with a clear question and conclusion.',
    learned: 'I learned to question my assumptions and to test the risky parts of a plan first.',
    skills: ['Research', 'Data analysis', 'Technical writing'],
  },
};
