import Link from 'next/link';
import { fullName, profile } from '@/data/profile';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.mark}>{fullName}</p>
        <p className={styles.col}>
          <span className={styles.label}>Contact</span>
          <a href={`mailto:${profile.email}`}>{profile.email}</a>
        </p>
        <p className={styles.col}>
          <span className={styles.label}>Pages</span>
          <span className={styles.links}>
            <Link href="/">Index</Link> <Link href="/work">Work</Link> <Link href="/achievements">Achievements</Link> <Link href="/about">About</Link> <Link href="/random">Random</Link>
          </span>
        </p>
        <p className={styles.col}>
          <span className={styles.label}>Colophon</span>
          © {new Date().getFullYear()} {fullName}
        </p>
      </div>
    </footer>
  );
}
