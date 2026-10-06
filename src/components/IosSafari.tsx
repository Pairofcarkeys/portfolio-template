'use client';

import { useEffect, useState } from 'react';
import { designSites, hostOf, iconFor, phonePosterFor, phoneTintOf, type DesignSite } from '@/data/design-work';
import { BatterySolid, ChevronLeft, Share, Signal, WifiSolid } from './mac-icons';
import styles from './IosSafari.module.css';

/** iOS status bar height; the page starts below it (capture-design-work.py --phone matches). */
export const STATUS_BAR = 54;

type Props = {
  site: DesignSite;
  select: (site: DesignSite) => void;
  /** Rendered size in CSS px: the iPhone 15 Pro Max's 430-point-wide display. */
  width: number;
  height: number;
  /** Phones see the frame but tap through to the live site instead. */
  interactive: boolean;
};

/** Dark glyphs on light pages, light glyphs on dark ones, as iOS does. */
const isDark = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.55;
};

function useTime() {
  const [time, setTime] = useState('9:41');
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M$/, ''));
    tick();
    const timer = setInterval(tick, 15_000);
    return () => clearInterval(timer);
  }, []);
  return time;
}

/** iOS 26 Safari on an iPhone, open on one of the design sites. Sized in real screen points. */
export function IosSafari({ site, select, width, height, interactive }: Props) {
  const time = useTime();
  const [loaded, setLoaded] = useState<string | null>(null);
  const [reloads, setReloads] = useState(0);
  const index = designSites.indexOf(site);
  const previous = designSites[(index - 1 + designSites.length) % designSites.length];
  const ready = loaded === `${site.id}:${reloads}`;
  const tint = phoneTintOf(site);

  return (
    <div className={styles.phone} style={{ width, height, background: tint.top }} data-ios-safari data-dark-top={isDark(tint.top)} data-dark-bottom={isDark(tint.bottom)}>
      <div className={styles.status} aria-hidden="true">
        <span className={styles.time}>{time}</span>
        <span className={styles.glyphs}><Signal /><WifiSolid /><BatterySolid /></span>
      </div>
      <div className={styles.island} aria-hidden="true" />

      <div className={styles.viewport} style={{ top: STATUS_BAR, background: tint.bottom }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={site.id} className={styles.poster} src={phonePosterFor(site)} alt="" data-hidden={ready} />
        {interactive && (
          <iframe key={`${site.id}:${reloads}`} className={styles.frame} src={site.url} title={`${site.title} — live site, phone layout`}
            data-ready={ready} onLoad={() => setLoaded(`${site.id}:${reloads}`)}
            sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
            allow="autoplay; fullscreen; encrypted-media" referrerPolicy="strict-origin-when-cross-origin" />
        )}
      </div>

      {/* iOS 26's compact tab bar: one floating glass capsule over the page. */}
      <div className={styles.bar}>
        <button type="button" className={styles.round} aria-label={`Previous site: ${previous.title}`} onClick={() => select(previous)}><ChevronLeft /></button>
        <button type="button" className={styles.address} aria-label={`Reload ${hostOf(site)}`} onClick={() => setReloads(count => count + 1)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={iconFor(site)} alt="" className={styles.favicon} />
          <span className={styles.host}>{hostOf(site)}</span>
          <span className={styles.progress} data-loading={interactive && !ready} aria-hidden="true" />
        </button>
        <a className={styles.round} href={site.url} target="_blank" rel="noreferrer" aria-label={`Open ${site.title} in a new tab`}><Share /></a>
      </div>
      <span className={styles.home} aria-hidden="true" />
    </div>
  );
}
