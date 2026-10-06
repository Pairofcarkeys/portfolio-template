import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { PlaylistPlayer } from '@/components/PlaylistPlayer';
import { fullName } from '@/data/profile';
import styles from './page.module.css';

export const metadata: Metadata = {
  ...pageMetadata({ title: 'Random', description: `Loose ends, drafts, and miscellany from ${fullName}.`, path: '/random' }),
  robots: { index: false, follow: true },
};

export default function RandomPage() {
  return (
    <main className={styles.page} id="main-content">
      <header className={styles.head}>
        <div className={styles.bar}>
          <span className="label">§ Random</span>
          <span className="label muted">Drafts &amp; miscellany</span>
          <span className="label muted">03 items</span>
        </div>
        <h1 className={styles.title}>A drawer of loose ends.</h1>
        <p className={styles.lede}>
          Half-finished thoughts, drafts, screenshots, and things I made on a Sunday. Nothing here
          is finished. That&apos;s the point.
        </p>
      </header>

      <section className={styles.body} aria-label="Items">
        <div className={styles.main}>
        <ol className={styles.list}>
          <li>
            <span className={styles.dot} aria-hidden>01</span>
            <span>A half-written essay about something you keep thinking about.</span>
            <span className={styles.status}>Draft</span>
          </li>
          <li>
            <span className={styles.dot} aria-hidden>02</span>
            <span>A weekend experiment that never became a project.</span>
            <span className={styles.status}>Sketch</span>
          </li>
          <li>
            <span className={styles.dot} aria-hidden>03</span>
            <span>Anything that doesn&apos;t fit on the portfolio goes here.</span>
            <span className={styles.status}>Placeholder</span>
          </li>
        </ol>

        <section className={styles.listen} aria-labelledby="listening-heading">
          <header className={styles.listenBar}>
            <span className={`label ${styles.listenNum}`}>(02)</span>
            <h2 id="listening-heading" className={`label ${styles.listenTitle}`}>Listening</h2>
            <span className={`label muted ${styles.listenAside}`}>What I&apos;m listening to right now</span>
          </header>
          <div className={styles.listenPlayer}>
            <PlaylistPlayer />
          </div>
        </section>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/random-mark.svg"
          alt=""
          aria-hidden="true"
          className={styles.mark}
        />
      </section>
    </main>
  );
}
