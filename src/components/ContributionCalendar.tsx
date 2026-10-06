import type { CSSProperties } from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type SocialSnapshot = { schemaVersion: number; fetchedAt: string; complete: boolean; dailyPosts: { date: string; count: number }[] };

// Server-only optional file read: no fabricated snapshot or client-side credentials.
function readSocialSnapshot(): SocialSnapshot | null {
  try {
    const value: SocialSnapshot = JSON.parse(readFileSync(join(process.cwd(), 'src/data/social-stats.json'), 'utf8'));
    if (value.schemaVersion !== 1 || !Number.isFinite(Date.parse(value.fetchedAt)) || typeof value.complete !== 'boolean' || !Array.isArray(value.dailyPosts)) return null;
    const dates = new Set<string>();
    for (const day of value.dailyPosts) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date) || !Number.isFinite(Date.parse(`${day.date}T00:00:00Z`)) || new Date(`${day.date}T00:00:00Z`).toISOString().slice(0, 10) !== day.date || !Number.isSafeInteger(day.count) || day.count < 0 || dates.has(day.date)) return null;
      dates.add(day.date);
    }
    return value;
  } catch { return null; }
}
const socialLevel = (count: number) => count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : count <= 4 ? 3 : 4;
import snapshot from '../data/github-contributions.json';
import styles from './ContributionCalendar.module.css';
import { ViewsCounter } from './ViewsCounter';
import { readSocialSummary } from '@/lib/read-social-summary';
import { profile } from '@/data/profile';

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const formatDate = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

export default function ContributionCalendar() {
  const social = readSocialSnapshot();
  const postsByDate = new Map(social?.dailyPosts.map(day => [day.date, day.count]) ?? []);
  const displayedDates = new Set(snapshot.days.map(day => day.date));
  const outsidePosts = social?.dailyPosts.filter(day => !displayedDates.has(day.date)).reduce((total, day) => total + day.count, 0) ?? 0;
  // Real Sunday–Saturday weeks, newest week at the left. Partial weeks
  // retain their empty slots so every date stays in its truthful weekday row.
  const first = new Date(`${snapshot.range.start}T00:00:00Z`).getTime();
  const start = first - snapshot.days[0].weekday * 86400000;
  const weekCount = Math.ceil((snapshot.days.length + snapshot.days[0].weekday) / 7);
  const weeks = Array.from({ length: weekCount }, () => new Map<number, typeof snapshot.days[number]>());
  snapshot.days.forEach(day => weeks[Math.floor((Date.parse(`${day.date}T00:00:00Z`) - start) / 604800000)].set(day.weekday, day));
  weeks.reverse();
  let previousMonth = '';
  const monthLabels = weeks.map(week => {
    const newest = Array.from(week.values()).sort((a, b) => b.date.localeCompare(a.date))[0];
    const month = newest.date.slice(0, 7);
    const label = month !== previousMonth ? months[Number(month.slice(5)) - 1] : '';
    previousMonth = month;
    return label;
  });
  return (
    <section className={styles.calendar} aria-label="GitHub contribution history" aria-describedby="calendar-availability" style={{ '--weeks': weekCount } as CSSProperties}>
      <header className={styles.counters}>
        <div className={styles.heading}>
        <strong>{snapshot.totalContributions.toLocaleString('en-US')}</strong>
        <a href={profile.githubUrl}>GitHub contributions ↗</a>
        </div>
        <ViewsCounter initial={readSocialSummary()} compact />
      </header>
      <div className={styles.gridScroller} role="region" aria-label="Activity calendar; newest weeks first, scroll for earlier activity" tabIndex={0}>
      <div data-calendar-grid="horizontal" role="table" aria-label="Daily contributions, Sunday to Saturday rows, newest weeks first from left to right" className={styles.table}>
        <div role="row" className={styles.months}>
          <span aria-hidden="true" />
          {monthLabels.map((month, week) => <span role="columnheader" key={week} className={styles.month}>{month}</span>)}
        </div>
        {weekdays.map((name, weekday) => (
          <div role="row" data-weekday={weekday} className={styles.row} key={name}>
            <span role="rowheader" className={styles.weekday} aria-label={name}>{name}</span>
            {weeks.map((week, index) => {
              const day = week.get(weekday);
              if (!day) return <span role="cell" key={index} aria-label="Outside date range" />;
              const postCount = social ? (postsByDate.get(day.date) ?? 0) : undefined;
              const label = `${day.count} ${day.count === 1 ? 'contribution' : 'contributions'} on ${formatDate(day.date)} (UTC); ${postCount === undefined ? 'social data unavailable' : `${postCount} recorded social ${postCount === 1 ? 'post' : 'posts'}`}`;
              return <span role="cell" key={day.date} className={styles.cell}>
                <span tabIndex={0} data-date={day.date} data-level={day.level} data-social-level={postCount === undefined ? undefined : socialLevel(postCount)} data-social-count={postCount} className={styles.dot} aria-label={label} aria-describedby="calendar-availability">
                  <span role="tooltip" className={styles.tooltip}>{label}</span>
                </span>
              </span>;
            })}
          </div>
        ))}
      </div>
      </div>
      <p className={styles.swipeHint}>Latest weeks first <span aria-hidden="true">·</span> Swipe for earlier activity <span aria-hidden="true">→</span></p>
      <div className={styles.legends}>
        <div className={styles.legend} data-calendar-legend="github" aria-label="GitHub contribution intensity from less to more">
          <span>GitHub</span><span>Less</span>{[0, 1, 2, 3, 4].map(level => <span key={level} className={styles.dot} data-level={level} aria-hidden="true" />)}<span>More</span>
        </div>
        <div className={styles.legend} data-calendar-legend="social" aria-label="Social posts per UTC day: light red 1, medium red 2, darker red 3 to 4, darkest red 5 or more; split squares show both activities">
          <span>Social posts/day</span>{[1, 2, 3, 4].map((level, index) => <span key={level} className={styles.legendItem}><span className={styles.socialSwatch} data-social-level={level} aria-hidden="true" />{['1', '2', '3–4', '5+'][index]}</span>)}
        </div>
      </div>
      <p id="calendar-availability" hidden>{snapshot.range.start}–{snapshot.range.end} UTC. Grey: GitHub · Red: social · Split: both.{' '}{social ? <>{social.complete ? 'Recorded social activity' : 'Partial social coverage'}; updated <time dateTime={social.fetchedAt}>{social.fetchedAt.slice(0, 10)}</time>.{' '}Zero means none recorded, not verified inactivity. Account collection windows may differ.{outsidePosts > 0 && <>{' '}{outsidePosts} recorded posts outside this window.</>}</> : 'Social data unavailable.'}{' '}Includes private GitHub activity. Updated <time dateTime={snapshot.fetchedAt}>{new Date(snapshot.fetchedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}</time>.</p>
    </section>
  );
}
