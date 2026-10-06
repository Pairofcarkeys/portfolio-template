import Link from 'next/link';
import { AboutContents } from '@/components/AboutContents';
import { ProfileStructuredData } from '@/components/StructuredData';
import { fullName, headline, profile } from '@/data/profile';
import { readSocialSummary } from '@/lib/read-social-summary';
import { pageMetadata } from '@/lib/seo';
import styles from './page.module.css';

export const metadata = pageMetadata({
  title: `About ${fullName}`,
  description: `Meet ${fullName}, ${headline}. Experience, projects, education and the things in between.`,
  path: '/about',
  type: 'profile',
});

/* SAMPLE COPY — rewrite every section in your own words. Section ids must match AboutContents. */
export default function AboutPage() {
  const social = readSocialSummary();
  return (
    <main className={styles.page} id="main-content" aria-labelledby="about-heading">
      <ProfileStructuredData />
      <header className={styles.intro}>
        <div className={styles.eyebrow}><span className="label">{fullName}</span><span className="label muted">Biography</span><span className="label muted">06 sections</span></div>
        <h1 id="about-heading">About</h1>
        <p className={styles.lede}>
          I’m {fullName}, {profile.role.toLowerCase()} of <Link href={`/timeline/${profile.companyEntryId}`}>{profile.company}</Link>.
          Write two or three sentences here that tell a stranger who you are, what you work on,
          and what you care about.
        </p>
      </header>

      <div className={styles.layout}>
        <AboutContents className={styles.contents} />

        <div className={styles.story}>
          <section id="work">
            <h2>What I work on</h2>
            <p>
              Describe your current work. What does <Link href="/timeline/your-company">Your Company</Link> do,
              who is it for, and what is your part in it? Keep it concrete: one or two results say more than
              a list of adjectives.
            </p>
            <p>
              Mention the role that came before, such as your time at <Link href="/timeline/example-corp">Example Corp</Link>,
              and what it taught you that you still use.
            </p>
          </section>

          <section id="projects">
            <h2>Projects</h2>
            <p>
              Point readers at the projects you are proudest of. <Link href="/timeline/project-one">Project One</Link> is
              a good place to link a write-up with screenshots; <Link href="/timeline/project-two">Project Two</Link> could
              be research, a side project, or something you built for fun.
            </p>
          </section>

          <section id="audience">
            <h2>Writing &amp; audience</h2>
            <p>
              {social ? <>Across the sample accounts in this template, the posts collected total{' '}
                <Link href="/achievements">{social.views.toLocaleString('en-US')} observed views</Link>.</>
                : <>The <Link href="/achievements">achievements page</Link> tracks observed views across your accounts.</>}
              {' '}Replace this with how you share your work: a newsletter, videos, talks, or open source.
            </p>
          </section>

          <section id="background">
            <h2>Where I started</h2>
            <p>
              Where did you grow up and study? <Link href="/timeline/example-university">Example University</Link> and
              <Link href="/timeline/example-high-school"> Example High School</Link> are placeholders for your own
              education. A sentence about what first got you interested in your field goes a long way.
            </p>
          </section>

          <section id="outside">
            <h2>Outside work</h2>
            <p>
              Sport, music, volunteering: whatever you do when you are not working. The sample timeline lists
              <Link href="/timeline/city-sports-club"> a club team</Link> and <Link href="/timeline/volunteer-tutoring">volunteer
              tutoring</Link>; swap in your own.
            </p>
          </section>

          <section id="further-reading" className={styles.reading}>
            <h2>Further reading</h2>
            <ul>
              <li><Link href="/">The full experience and project timeline</Link></li>
              <li><Link href="/achievements">Achievements</Link></li>
              <li><a href="https://example.com">An interview or article about you — Example Publication</a></li>
            </ul>
          </section>

          <footer className={styles.contact}>
            <span>Say hello.</span>
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
          </footer>
        </div>
      </div>
    </main>
  );
}
