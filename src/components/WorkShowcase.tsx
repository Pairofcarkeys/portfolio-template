'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { designGroups, designSites, groupOf, type DesignSite } from '@/data/design-work';
import { createShuffleDeck } from '@/lib/shuffle-deck';
import { MacDesktop } from './MacDesktop';
import type { LaptopFrame, Quad } from './laptop-renderer';
import styles from './WorkShowcase.module.css';

/** Safari is laid out at the 16-inch MacBook Pro's default 1728-point width. */
const SCREEN_WIDTH = 1728;
/** Autoplay dwell per site. */
const DWELL_MS = 3000;

/** CSS matrix3d taking a width×height box onto an arbitrary quad (a planar homography). */
function quadTransform([[x0, y0], [x1, y1], [x2, y2], [x3, y3]]: Quad, width: number, height: number) {
  const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2;
  const sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
  const det = dx1 * dy2 - dx2 * dy1;
  const g = (sx * dy2 - dx2 * sy) / det;
  const h = (dx1 * sy - sx * dy1) / det;
  const a = x1 - x0 + g * x1, b = x3 - x0 + h * x3;
  const d = y1 - y0 + g * y1, e = y3 - y0 + h * y3;
  return `matrix3d(${[a, d, 0, g, b, e, 0, h, 0, 0, 1, 0, x0, y0, 0, 1].join(',')}) scale(${1 / width}, ${1 / height})`;
}

type Mode = 'loading' | '3d' | 'flat';

export function WorkShowcase() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>('loading');
  const [aspect, setAspect] = useState(1.55);
  const [opened, setOpened] = useState(false);
  const [flatScale, setFlatScale] = useState(0.5);
  const [touch, setTouch] = useState(false);
  const [site, setSite] = useState<DesignSite>(designSites[0]);
  // Autoplay shuffles screenshots; the live site loads once someone engages with it.
  const [playing, setPlaying] = useState(true);
  const [hovering, setHovering] = useState(false);
  const [inside, setInside] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [live, setLive] = useState(false);
  const deck = useRef(createShuffleDeck(designSites));
  const menu = useRef<HTMLOListElement>(null);
  const aside = useRef<HTMLElement>(null);
  const running = playing && opened && !hovering && !inside && !hidden;
  const screenHeight = Math.round(SCREEN_WIDTH / aspect);

  useEffect(() => { setTouch(window.matchMedia('(pointer: coarse)').matches); }, []);

  useEffect(() => {
    const host = stage.current;
    const surface = canvas.current;
    if (!host || !surface) return;
    let cancelled = false;
    let renderer: { dispose: () => void } | null = null;
    let aspectNow = 1.55;
    const height = () => Math.round(SCREEN_WIDTH / aspectNow);
    const place = ({ quad, power, done }: LaptopFrame) => {
      const node = screen.current;
      if (!node) return;
      node.style.transform = quadTransform(quad, SCREEN_WIDTH, height());
      node.style.opacity = String(power);
      node.style.visibility = power > 0 ? 'visible' : 'hidden';
      if (done) setOpened(true);
    };
    const fail = () => { renderer?.dispose(); renderer = null; if (!cancelled) setMode('flat'); };
    (async () => {
      try {
        const probe = document.createElement('canvas');
        if (!probe.getContext('webgl2') && !probe.getContext('webgl')) throw new Error('no webgl');
        const { createLaptopRenderer } = await import('./laptop-renderer');
        if (cancelled) return;
        const animate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        renderer = createLaptopRenderer({
          host, canvas: surface, animate, frame: place, failed: fail,
          ready: value => { aspectNow = value; if (!cancelled) { setAspect(value); setMode('3d'); } },
        });
      } catch { fail(); }
    })();
    return () => { cancelled = true; renderer?.dispose(); };
  }, []);

  // Without WebGL the same desktop sits flat, scaled to the column.
  useEffect(() => {
    if (mode !== 'flat' || !stage.current) return;
    const host = stage.current;
    const fit = () => setFlatScale(host.getBoundingClientRect().width / SCREEN_WIDTH);
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(host);
    return () => observer.disconnect();
  }, [mode]);

  // Picking a site by hand stops the shuffle and loads it live.
  const select = useCallback((next: DesignSite) => { setSite(next); setPlaying(false); setLive(true); }, []);
  const step = useCallback((by: number) => {
    setSite(current => designSites[(designSites.indexOf(current) + by + designSites.length) % designSites.length]);
    setPlaying(false);
    setLive(true);
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => { setLive(false); setSite(current => deck.current.next(current)); }, DWELL_MS);
    return () => clearTimeout(timer);
  }, [running, site]);

  // Hover over the laptop or menu holds the shuffle. Tracked page-wide because the
  // live iframe swallows its own pointer events, so a leave from it never fires.
  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || !(event.target instanceof Node)) return;
      const onLaptop = !!stage.current?.contains(event.target);
      setHovering(onLaptop || !!aside.current?.contains(event.target));
      if (onLaptop) setLive(true);
    };
    const leave = () => setHovering(false);
    window.addEventListener('pointermove', move);
    document.documentElement.addEventListener('pointerleave', leave);
    return () => { window.removeEventListener('pointermove', move); document.documentElement.removeEventListener('pointerleave', leave); };
  }, []);

  // Clicking into the live site moves focus into the iframe: hold the shuffle while it has it.
  useEffect(() => {
    const blur = () => setTimeout(() => { if (document.activeElement?.tagName === 'IFRAME') { setInside(true); setLive(true); } });
    const focus = () => setInside(false);
    const visibility = () => setHidden(document.hidden);
    window.addEventListener('blur', blur);
    window.addEventListener('focus', focus);
    document.addEventListener('visibilitychange', visibility);
    return () => { window.removeEventListener('blur', blur); window.removeEventListener('focus', focus); document.removeEventListener('visibilitychange', visibility); };
  }, []);

  // Keep the active row in view inside the menu without scrolling the page.
  useEffect(() => {
    const list = menu.current;
    const row = list?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!list || !row) return;
    const top = row.offsetTop - list.offsetTop;
    if (top < list.scrollTop || top + row.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTo({ top: top - list.clientHeight / 2 + row.offsetHeight / 2, behavior: 'smooth' });
    }
  }, [site]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest('input, textarea, [contenteditable]')) return;
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      step(event.key === 'ArrowRight' ? 1 : -1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step]);

  const group = groupOf(site);

  return (
    <section className={styles.showcase} aria-label="Design work">
      <div ref={stage} className={styles.stage} data-mode={mode} data-opened={opened}
        style={mode === 'flat' ? { height: screenHeight * flatScale } : undefined}
>
        <canvas ref={canvas} className={styles.canvas} aria-hidden="true" />
        <div ref={screen} className={styles.screen}
          style={mode === 'flat' ? { transform: `scale(${flatScale})`, opacity: 1, visibility: 'visible' } : undefined}>
          <MacDesktop site={site} select={select} width={SCREEN_WIDTH} height={screenHeight} interactive={!touch && live} />
          <span className={styles.glare} aria-hidden="true" />
        </div>
        {touch && <a className={styles.tapThrough} href={site.url} target="_blank" rel="noreferrer" aria-label={`Open ${site.title} live`} />}
      </div>

      <div className={styles.caption}>
        <p className={styles.counter} aria-live="polite">
          <span>{String(designSites.indexOf(site) + 1).padStart(2, '0')}</span>
          <span className={styles.of}>/ {designSites.length}</span>
        </p>
        <p className={styles.now}>
          <strong>{site.title}</strong>
          <span className={styles.muted}>{group.label}{site.concept && <span className={styles.badge}>Concept</span>}</span>
        </p>
        <p className={styles.actions}>
          <button type="button" onClick={() => step(-1)} aria-label="Previous site">← Prev</button>
          <button type="button" onClick={() => step(1)} aria-label="Next site">Next →</button>
          <a className={styles.live} href={site.url} target="_blank" rel="noreferrer">Open live site ↗</a>
        </p>
      </div>

      <aside ref={aside} className={styles.menu} aria-label="All design sites">
        <div className={styles.menuHead}>
          <span className="label">Index · {designSites.length}</span>
          <button type="button" className={styles.shuffle} aria-pressed={playing} onClick={() => { setPlaying(value => !value); if (!playing) setLive(false); }}>
            <span className={styles.dotLive} data-running={running} aria-hidden="true" />
            {playing ? (running ? 'Shuffling' : 'Paused') : 'Shuffle'}
          </button>
        </div>
        <ol ref={menu} className={styles.menuList}>
          {designGroups.map((entry, g) => (
            <li key={entry.id}>
              <h2><span className={styles.groupNum}>{String.fromCharCode(65 + g)}</span>{entry.label}</h2>
              <ol>
                {designSites.filter(item => item.group === entry.id).map(item => {
                  const active = item.id === site.id;
                  return (
                    <li key={item.id}>
                      <button type="button" aria-current={active ? 'true' : undefined} onClick={() => select(item)}>
                        <span className={styles.siteNum}>{String(designSites.indexOf(item) + 1).padStart(2, '0')}</span>
                        <span className={styles.siteTitle}>{item.title}</span>
                        {active && <i key={`${item.id}:${running}`} className={styles.timer} data-running={running} aria-hidden="true" />}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </li>
          ))}
        </ol>
      </aside>
    </section>
  );
}
