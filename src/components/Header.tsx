'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { fullName, profile } from '@/data/profile';
import styles from './Header.module.css';

const LINKS = [
  { href: '/', label: 'Index' },
  { href: '/work', label: 'Work' },
  { href: '/achievements', label: 'Achievements' },
  { href: '/about', label: 'About' },
  { href: '/random', label: 'Random' },
];

export function Header() {
  const path = usePathname();
  const isActive = (href: string) => (href === '/' ? path === '/' || path.startsWith('/timeline') : path === href);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          {fullName}
        </Link>
        <p className={styles.role}>{profile.role}, {profile.company}<br />{profile.location}</p>
        <nav className={styles.nav} aria-label="Main navigation">
          {LINKS.map((l, i) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? 'page' : undefined}
              className={isActive(l.href) ? styles.active : undefined}
            >
              <span className={styles.num} aria-hidden="true">{String(i).padStart(2, '0')}</span>
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
