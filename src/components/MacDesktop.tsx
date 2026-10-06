'use client';

import { useEffect, useState } from 'react';
import { FaApple } from 'react-icons/fa';
import { IoLockClosed, IoReload, IoWifi, IoSearch } from 'react-icons/io5';
import { Battery, ChevronLeft, ChevronRight, Plus, Share, Sidebar, Tabs } from './mac-icons';
import { designGroups, designSites, hostOf, iconFor, posterFor, type DesignSite } from '@/data/design-work';
import styles from './MacDesktop.module.css';

type Props = {
  site: DesignSite;
  select: (site: DesignSite) => void;
  /** Rendered width in CSS px; the height follows the panel's aspect. */
  width: number;
  height: number;
  /** Phones see the frame but tap through to the live site instead. */
  interactive: boolean;
};

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(timer);
  }, []);
  if (!now) return '';
  const day = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${day.replace(',', '')}  ${time}`;
}

/** A macOS desktop with Safari open on one of the design sites. Sized in real screen points. */
export function MacDesktop({ site, select, width, height, interactive }: Props) {
  const clock = useClock();
  const [loaded, setLoaded] = useState<string | null>(null);
  const [reloads, setReloads] = useState(0);
  const tabs = designSites.filter(entry => entry.group === site.group);
  const index = designSites.indexOf(site);
  const previous = designSites[(index - 1 + designSites.length) % designSites.length];
  const next = designSites[(index + 1) % designSites.length];
  const ready = loaded === `${site.id}:${reloads}`;

  return (
    <div className={styles.desktop} style={{ width, height }} data-mac-desktop>
      <div className={styles.menubar} aria-hidden="true">
        <div className={styles.menus}>
          <FaApple className={styles.apple} />
          <b>Safari</b><span>File</span><span>Edit</span><span>View</span><span>History</span><span>Bookmarks</span><span>Window</span><span>Help</span>
        </div>
        <div className={styles.status}>
          <Battery className={styles.battery} /><IoWifi /><IoSearch /><span>{clock}</span>
        </div>
      </div>
      <div className={styles.notch} aria-hidden="true" />

      <div className={styles.window}>
        <div className={styles.toolbar}>
          <div className={styles.lights} aria-hidden="true"><i /><i /><i /></div>
          <div className={styles.navButtons}>
            <Sidebar className={styles.sidebarIcon} />
            <button type="button" aria-label={`Previous site: ${previous.title}`} onClick={() => select(previous)}><ChevronLeft /></button>
            <button type="button" aria-label={`Next site: ${next.title}`} onClick={() => select(next)}><ChevronRight /></button>
          </div>
          <div className={styles.address}>
            <span className={styles.progress} data-loading={!ready} aria-hidden="true" />
            <IoLockClosed className={styles.lock} aria-hidden="true" />
            <span className={styles.host}>{hostOf(site)}</span>
            <button type="button" className={styles.reload} aria-label="Reload site" onClick={() => setReloads(count => count + 1)}><IoReload /></button>
          </div>
          <div className={styles.toolIcons}>
            <a href={site.url} target="_blank" rel="noreferrer" aria-label={`Open ${site.title} in a new tab`}><Share /></a>
            <Plus /><Tabs />
          </div>
        </div>

        <div className={styles.tabs} role="tablist" aria-label="Sites in this project">
          {tabs.map(tab => (
            <button key={tab.id} type="button" role="tab" aria-selected={tab.id === site.id} className={styles.tab} onClick={() => select(tab)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={iconFor(tab)} alt="" className={styles.favicon} />
              <span>{tab.title}</span>
            </button>
          ))}
        </div>

        <nav className={styles.favorites} aria-label="Projects">
          {designGroups.map(group => (
            <button key={group.id} type="button" aria-current={group.id === site.group ? 'true' : undefined}
              onClick={() => select(designSites.find(entry => entry.group === group.id)!)}>{group.label}</button>
          ))}
        </nav>

        <div className={styles.viewport}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={site.id} className={styles.poster} src={posterFor(site)} alt="" data-hidden={ready} />
          {interactive && (
            <iframe key={`${site.id}:${reloads}`} className={styles.frame} src={site.url} title={`${site.title} — live site`}
              data-ready={ready} onLoad={() => setLoaded(`${site.id}:${reloads}`)}
              sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
              allow="autoplay; fullscreen; encrypted-media" referrerPolicy="strict-origin-when-cross-origin" />
          )}
        </div>
      </div>
    </div>
  );
}
