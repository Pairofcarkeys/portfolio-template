/**
 * Who this site is about. Every page, the header, the footer, the contact list
 * and the structured data read from here — edit this file first.
 */
export const profile = {
  firstName: 'Your',
  lastName: 'Name',
  /** Shown under the name in the header and on the homepage profile. */
  role: 'Co-founder',
  company: 'Your Company',
  /** Detail page the company name links to (a timeline entry id). */
  companyEntryId: 'your-company',
  location: 'City, Country',
  email: 'you@example.com',
  /** One sentence for the homepage profile block. */
  bio: 'I design and build software, and write about what I learn along the way.',
  /** GitHub profile linked from the activity calendar. */
  githubUrl: 'https://github.com/your-username',
  /** The first year shown in the timeline range ("2014 — Now"). */
  sinceYear: 2014,
};

export const fullName = `${profile.firstName} ${profile.lastName}`;
export const headline = `${profile.role} of ${profile.company}`;
