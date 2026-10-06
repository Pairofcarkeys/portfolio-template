import type { Metadata } from 'next';
import Link from 'next/link';
import { ViewsCounter } from '@/components/ViewsCounter';
import { fullName } from '@/data/profile';
import { readSocialSummary } from '@/lib/read-social-summary';
import { pageMetadata } from '@/lib/seo';
import styles from './page.module.css';

export const metadata: Metadata = {
  ...pageMetadata({ title: 'Achievements', description: `${fullName}’s achievements: product launches, audience growth, and awards.`, path: '/achievements' }),
  alternates: { canonical: '/achievements' },
};

/* SAMPLE ACHIEVEMENTS — replace the figures, headings and links with your own. */
export default function AchievementsPage() {
  return <main className={styles.page} id="main-content" aria-labelledby="achievements-heading">
    <header className={styles.head}>
      <div className={styles.bar}>
        <span className="label">Record</span>
        <span className="label muted">Product · Audience · Awards</span>
        <span className="label muted">03 entries</span>
      </div>
      <h1 id="achievements-heading" className={styles.title}>Achievements</h1>
    </header>

    <ol className={styles.list}>
      <li className={`${styles.item} ${styles.wide}`}>
        <section aria-labelledby="views-heading">
          <div className={styles.meta}><span className={styles.num}>01</span><span className="label">Audience</span></div>
          <h2 id="views-heading" className={styles.heading}>Views I&apos;ve generated</h2>
          <ViewsCounter initial={readSocialSummary()} />
        </section>
      </li>
      <li className={styles.item}>
        <section aria-labelledby="launch-heading">
          <div className={styles.meta}><span className={styles.num}>02</span><span className="label">Product</span></div>
          <p className={styles.figure} aria-hidden="true">#1</p>
          <h2 id="launch-heading" className={styles.heading}>#1 product of the day on a launch site</h2>
          <div className={styles.result}><span className={styles.product}><Link href="/timeline/your-company">Your Company</Link></span><p>Describe the launch in one line.</p></div>
        </section>
      </li>
      <li className={styles.item}>
        <section aria-labelledby="award-heading">
          <div className={styles.meta}><span className={styles.num}>03</span><span className="label">Awards</span></div>
          <p className={styles.figure} aria-hidden="true">2×</p>
          <h2 id="award-heading" className={styles.heading}>2x Regional Champion</h2>
          <div className={styles.result}><span className={styles.product}>2020 &amp; 2021</span><p>With <Link href="/timeline/city-sports-club">City Sports Club</Link>.</p></div>
        </section>
      </li>
    </ol>
  </main>;
}
