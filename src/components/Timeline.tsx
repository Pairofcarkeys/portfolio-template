'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CATEGORIES,
  orderOf,
  timeline,
  type TimelineCategory,
  type TimelineEntry,
} from '@/data/timeline';
import { profile } from '@/data/profile';
import styles from './Timeline.module.css';

type Filter = TimelineCategory | 'all';
type SortKey = 'date' | 'title' | 'role' | 'location' | 'category';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  ...CATEGORIES,
];

const COLUMNS: { key: SortKey; label: string; className: string }[] = [
  { key: 'date', label: 'Date', className: styles.cDate },
  { key: 'title', label: 'Organisation', className: styles.cTitle },
  { key: 'role', label: 'Role', className: styles.cRole },
  { key: 'location', label: 'Location', className: styles.cLocation },
  { key: 'category', label: 'Type', className: styles.cCategory },
];

const NO_LOCATION = 'Location not listed';
const categoryLabel = (id: TimelineCategory) => CATEGORIES.find(c => c.id === id)?.label ?? id;
const roleOf = (entry: TimelineEntry) => entry.bullets[0];
const value = (entry: TimelineEntry, key: SortKey): string | number => {
  switch (key) {
    case 'date': return orderOf(entry);
    case 'title': return entry.title.toLowerCase();
    case 'role': return roleOf(entry).toLowerCase();
    case 'location': return entry.location === NO_LOCATION ? '￿' : entry.location.toLowerCase();
    case 'category': return CATEGORIES.findIndex(c => c.id === entry.category);
  }
};

export function Timeline() {
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'date', dir: -1 });
  const [query, setQuery] = useState('');
  const [detailed, setDetailed] = useState(false);

  const counts = useMemo(() => {
    const map = new Map<Filter, number>([['all', timeline.length]]);
    for (const c of CATEGORIES) map.set(c.id, timeline.filter(e => e.category === c.id).length);
    return map;
  }, []);

  const entries = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = timeline.filter(e =>
      (filter === 'all' || e.category === filter) &&
      (!q || [e.title, e.location, e.dateLabel, categoryLabel(e.category), ...e.bullets].join(' ').toLowerCase().includes(q)));
    // Stable sort with chronology as the tie-breaker, newest first.
    return list
      .map((e, i) => ({ e, i }))
      .sort((a, b) => {
        const av = value(a.e, sort.key), bv = value(b.e, sort.key);
        if (av < bv) return -1 * sort.dir;
        if (av > bv) return 1 * sort.dir;
        return a.i - b.i;
      })
      .map(({ e }) => e);
  }, [filter, sort, query]);

  const toggleSort = (key: SortKey) =>
    setSort(current => current.key === key ? { key, dir: current.dir === 1 ? -1 : 1 } : { key, dir: key === 'date' ? -1 : 1 });

  return (
    <section className={styles.wrap} id="experience" aria-labelledby="experience-heading">
      <header className="section-bar">
        <span className="num label">05</span>
        <h2 id="experience-heading" className={`title label ${styles.barTitle}`}>My experience — Index</h2>
        <span className="aside label">{profile.sinceYear} — Now</span>
      </header>

      <div className={styles.controls}>
        <div className={styles.filters} role="group" aria-label="Filter timeline">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={styles.filter}
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.label}<sup>{counts.get(f.id)}</sup>
            </button>
          ))}
        </div>
        <div className={styles.tools}>
          <label className={styles.search}>
            <span className="sr-only">Search experience</span>
            <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5 14 14" /></svg>
            <input type="search" placeholder="Search" value={query} onChange={event => setQuery(event.target.value)} />
          </label>
          <button type="button" className={styles.toggle} aria-pressed={detailed} onClick={() => setDetailed(v => !v)}>
            <span className={styles.switch} aria-hidden="true" />Descriptions
          </button>
        </div>
      </div>

      <div className={styles.table} data-experience-entries role="region" aria-label="Experience entries" data-detailed={detailed}>
        <div className={styles.head} role="group" aria-label="Sort entries">
          <span className={`${styles.cNo} label`} aria-hidden="true">No.</span>
          {COLUMNS.map(col => (
            <button
              key={col.key}
              type="button"
              className={`${col.className} ${styles.sort}`}
              data-active={sort.key === col.key}
              aria-label={`Sort by ${col.label}${sort.key === col.key ? (sort.dir === 1 ? ', ascending' : ', descending') : ''}`}
              onClick={() => toggleSort(col.key)}
            >
              {col.label}
              <span aria-hidden="true" className={styles.caret}>{sort.key === col.key ? (sort.dir === 1 ? '↑' : '↓') : '↕'}</span>
            </button>
          ))}
        </div>

        <ol className={styles.list}>
          {entries.map((entry, i) => (
            <li
              key={entry.id}
              className={styles.item}
              data-category={entry.category}
              data-timeline-entry={entry.id}
              style={{ animationDelay: `${Math.min(i * 18, 240)}ms` }}
            >
              <Link href={entry.href ?? '/'} className={styles.row}>
                <span className={`${styles.cNo} ${styles.no}`}>{String(i + 1).padStart(2, '0')}</span>
                <span className={`${styles.cDate} ${styles.date}`}>{entry.dateLabel}</span>
                <span className={`${styles.cTitle} ${styles.title}`}>
                  {entry.title}
                  {entry.end === null && <span className={styles.now}>Now</span>}
                </span>
                <span className={`${styles.cRole} ${styles.role}`}>{roleOf(entry)}</span>
                <span className={`${styles.cLocation} ${styles.location}`} data-location>
                  {entry.location === NO_LOCATION ? <span title={NO_LOCATION}>—<span className="sr-only">{NO_LOCATION}</span></span> : entry.location}
                </span>
                <span className={`${styles.cCategory} ${styles.category}`}>{categoryLabel(entry.category)}</span>
                <span className={styles.arrow} aria-hidden="true">→</span>
                <ul className={styles.bullets}>
                  {entry.bullets.slice(1).map((bullet) => <li key={bullet}>{bullet}</li>)}
                </ul>
              </Link>
            </li>
          ))}
        </ol>

        {entries.length === 0 && <p className={styles.empty}>Nothing here yet. <button type="button" onClick={() => { setQuery(''); setFilter('all'); }}>Clear filters</button></p>}
        <p className={`${styles.footnote} label`} aria-live="polite">
          Showing {entries.length} of {timeline.length} · Sorted by {COLUMNS.find(c => c.key === sort.key)!.label.toLowerCase()}, {sort.dir === 1 ? 'ascending' : 'descending'}
        </p>
      </div>
    </section>
  );
}
