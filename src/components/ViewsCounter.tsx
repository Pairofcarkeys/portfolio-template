'use client';

import { useEffect, useId, useState } from 'react';
import { isSocialSummary, type SocialSummary } from '@/lib/social-summary.mjs';
import styles from '@/app/achievements/page.module.css';
import compactStyles from './ContributionCalendar.module.css';

export function ViewsCounter({ initial, compact = false }: { initial: SocialSummary | null; compact?: boolean }) {
  const descriptionId = useId();
  const [summary, setSummary] = useState(initial);
  useEffect(() => {
    const controller = new AbortController();
    async function refresh() {
      if (document.hidden) return;
      try {
        const response = await fetch('/social-summary.json', { cache: 'no-store', signal: controller.signal });
        if (!response.ok) return;
        const next: unknown = await response.json();
        if (isSocialSummary(next)) setSummary(current => !current || Date.parse(next.fetchedAt) >= Date.parse(current.fetchedAt) ? next : current);
      } catch { /* Retain the last verified snapshot on refresh failure. */ }
    }
    void refresh();
    const interval = window.setInterval(refresh, 60_000);
    return () => { controller.abort(); window.clearInterval(interval); };
  }, []);

  if (!summary) return <div className={compact ? compactStyles.views : styles.result}>{compact && <span>Views I&apos;ve generated</span>}<span className={compact ? compactStyles.unavailable : styles.pending}>Awaiting verified counts</span><p hidden={compact}>No estimate displayed.</p></div>;
  const updated = new Date(summary.fetchedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
  if (compact) return <div className={compactStyles.views}>
    <output aria-label="Cumulative observed post views" aria-describedby={descriptionId}>{summary.postsWithViews ? summary.views.toLocaleString('en-US') : 'Unavailable'}</output>
    <a href="/achievements">Views I&apos;ve generated →</a>
    <p id={descriptionId} hidden>{summary.postCount.toLocaleString('en-US')} posts · {summary.accountCount} accounts · Instagram + TikTok. {!summary.complete ? 'Partial collection. ' : ''}{summary.postsWithViews < summary.postCount ? `${summary.postsWithViews.toLocaleString('en-US')} posts have available view counts. ` : ''}Views are lifetime observations on the included posts. <time dateTime={summary.fetchedAt}>Updated {updated} UTC</time></p>
  </div>;
  return <div className={styles.result}>
    <output aria-label="Cumulative observed post views" className={styles.count}>{summary.postsWithViews ? summary.views.toLocaleString('en-US') : 'Unavailable'}</output>
    <p>Across {summary.postsWithViews.toLocaleString('en-US')} posts · Instagram + TikTok · {summary.accountCount} accounts</p>
  </div>;
}
