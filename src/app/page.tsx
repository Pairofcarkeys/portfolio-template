import { pageMetadata } from '@/lib/seo';
import { Timeline } from '@/components/Timeline';
import { Socials } from '@/components/Socials';
import { MusicPlayer } from '@/components/MusicPlayer';
import ContributionCalendar from '@/components/ContributionCalendar';
import { timeline } from '@/data/timeline';
import { fullName, headline, profile } from '@/data/profile';
import { SITE_DESCRIPTION } from '@/lib/seo';
import styles from './page.module.css';

export const metadata = pageMetadata({
  title: `${fullName} — ${headline}`,
  description: SITE_DESCRIPTION,
  path: '/',
});

const counts = {
  experience: timeline.filter(e => e.category === 'experience').length,
  projects: timeline.filter(e => e.category === 'projects').length,
  education: timeline.filter(e => e.category === 'education').length,
  activities: timeline.filter(e => e.category === 'activities').length,
};

export default function HomePage() {
  return (
    <main className={styles.page} id="main-content">
      <section className={styles.cover} aria-labelledby="cover-name">
        <div className={styles.coverMeta}>
          <span className="label">Portfolio</span>
          <span className="label">Index of work, {profile.sinceYear} — Now</span>
          <span className="label">{timeline.length} entries</span>
        </div>

        <h1 id="cover-name" className={styles.name}>
          <span>{profile.firstName}</span> <span>{profile.lastName}</span>
        </h1>

        <div className={styles.coverGrid}>
          <figure className={styles.portrait}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/portrait.jpg" alt={fullName} width={600} height={900} fetchPriority="high" decoding="async" />
            <figcaption className="label">Fig. 1 — Portrait</figcaption>
          </figure>

          <div className={styles.intro}>
            <span className="label muted">(01) Profile</span>
            <p className={styles.lede}>
              {profile.role} at <a href={`/timeline/${profile.companyEntryId}`}>{profile.company}</a>.
            </p>
            <p className={styles.bio}>{profile.bio}</p>
            <dl className={styles.facts}>
              <div><dt className="label">Experience</dt><dd>{counts.experience}</dd></div>
              <div><dt className="label">Projects</dt><dd>{counts.projects}</dd></div>
              <div><dt className="label">Education</dt><dd>{counts.education}</dd></div>
              <div><dt className="label">Activities</dt><dd>{counts.activities}</dd></div>
            </dl>
            <a className={styles.experienceJump} href="#experience">Explore my experience <span aria-hidden="true">↓</span></a>
          </div>

          <div className={styles.side}>
            <div className={styles.block}>
              <span className="label muted">(02) Contact</span>
              <Socials />
            </div>
            <div className={styles.block}>
              <span className="label muted">(03) Listening</span>
              <MusicPlayer />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.activity} aria-labelledby="activity-heading">
        <header className="section-bar">
          <span className="num label">04</span>
          <h2 id="activity-heading" className={`title label ${styles.barTitle}`}>Activity</h2>
          <span className="aside label">Past 12 months</span>
        </header>
        <ContributionCalendar />
      </section>

      <Timeline />
    </main>
  );
}
