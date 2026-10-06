'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { designGroups, designSites, groupOf, type DesignSite } from '@/data/design-work';
import { createShuffleDeck } from '@/lib/shuffle-deck';
import { IosSafari } from './IosSafari';
import { MacDesktop } from './MacDesktop';
import type { LaptopFrame, Quad } from './laptop-renderer';
import styles from './WorkShowcase.module.css';

/**
 * Safari is laid out in each device's real points: the 16-inch MacBook Pro's
 * default 1728-point width, and the iPhone 15 Pro Max's 430. The aspect is a
 * first guess, replaced by the model's measured panel once it loads.
 */
const SCREENS = { laptop: { width: 1728, aspect: 1.55 }, phone: { width: 430, aspect: 0.463 } } as const;
type Device = keyof typeof SCREENS;
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

const LaptopIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="5" width="16" height="11" rx="1.2" /><path d="M2 19h20" strokeLinecap="round" />
  </svg>
);
const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
    <rect x="7" y="2.5" width="10" height="19" rx="2.6" /><path d="M10.5 5h3" strokeLinecap="round" />
  </svg>
);

export function WorkShowcase() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  // Each visitor starts on their own kind of screen; the toggle swaps it.
  const [device, setDevice] = useState<Device | null>(null);
  const [mode, setMode] = useState<Mode>('loading');
  const [aspect, setAspect] = useState(1.55);
  const [opened, setOpened] = useState(false);
  const [flat, setFlat] = useState({ scale: 0.5, x: 0, y: 0 });
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
  const screenWidth = SCREENS[device ?? 'laptop'].width;
  const screenHeight = Math.round(screenWidth / aspect);

  useEffect(() => {
    setTouch(window.matchMedia('(pointer: coarse)').matches);
    setDevice(window.matchMedia('(max-width: 720px)').matches ? 'phone' : 'laptop');
  }, []);

  useEffect(() => {
    const host = stage.current;
    const surface = canvas.current;
    if (!host || !surface || !device) return;
    let cancelled = false;
    let renderer: { dispose: () => void } | null = null;
    const { width } = SCREENS[device];
    let aspectNow: number = SCREENS[device].aspect;
    setAspect(aspectNow);
    setMode('loading');
    setOpened(false);
    const height = () => Math.round(width / aspectNow);
    const place = ({ quad, power, done }: LaptopFrame) => {
      const node = screen.current;
      if (!node) return;
      node.style.transform = quadTransform(quad, width, height());
      node.style.opacity = String(power);
      node.style.visibility = power > 0 ? 'visible' : 'hidden';
      if (done) setOpened(true);
    };
    const fail = () => { renderer?.dispose(); renderer = null; if (!cancelled) setMode('flat'); };
    (async () => {
      try {
        const probe = document.createElement('canvas');
        if (!probe.getContext('webgl2') && !probe.getContext('webgl')) throw new Error('no webgl');
        const create = device === 'phone'
          ? (await import('./phone-renderer')).createPhoneRenderer
          : (await import('./laptop-renderer')).createLaptopRenderer;
        if (cancelled) return;
        const animate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        renderer = create({
          host, canvas: surface, animate, frame: place, failed: fail,
          ready: value => { aspectNow = value; if (!cancelled) { setAspect(value); setMode('3d'); } },
        });
      } catch { fail(); }
    })();
    return () => {
      cancelled = true;
      renderer?.dispose();
      // The next device starts from a blank, hidden screen.
      if (screen.current) { screen.current.style.visibility = 'hidden'; screen.current.style.opacity = '0'; }
    };
  }, [device]);

  // Without WebGL the same screen sits flat: the desktop fills the column, the phone its height.
  useEffect(() => {
    if (mode !== 'flat' || !stage.current || !device) return;
    const host = stage.current;
    const fit = () => {
      const box = host.getBoundingClientRect();
      if (device === 'laptop') { setFlat({ scale: box.width / screenWidth, x: 0, y: 0 }); return; }
      const scale = (box.height * 0.92) / screenHeight;
      setFlat({ scale, x: (box.width - screenWidth * scale) / 2, y: (box.height - screenHeight * scale) / 2 });
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(host);
    return () => observer.disconnect();
  }, [mode, device, screenWidth, screenHeight]);

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
      <div ref={stage} className={styles.stage} data-mode={mode} data-opened={opened} data-device={device ?? undefined}
        style={mode === 'flat' && device === 'laptop' ? { height: screenHeight * flat.scale } : undefined}
>
        <canvas key={device} ref={canvas} className={styles.canvas} aria-hidden="true" />
        <div ref={screen} className={styles.screen}
          style={mode === 'flat' ? { transform: `translate(${flat.x}px, ${flat.y}px) scale(${flat.scale})`, opacity: 1, visibility: 'visible' } : undefined}>
          {device === 'laptop' && <MacDesktop site={site} select={select} width={screenWidth} height={screenHeight} interactive={!touch && live} />}
          {device === 'phone' && <IosSafari site={site} select={select} width={screenWidth} height={screenHeight} interactive={!touch && live} />}
          <span className={styles.glare} aria-hidden="true" />
        </div>
        {device && (
          <div className={styles.devices} role="group" aria-label="View the sites on">
            <button type="button" aria-pressed={device === 'laptop'} onClick={() => setDevice('laptop')} title="Laptop"><LaptopIcon /><span>Laptop</span></button>
            <button type="button" aria-pressed={device === 'phone'} onClick={() => setDevice('phone')} title="Phone"><PhoneIcon /><span>Phone</span></button>
          </div>
        )}
        {touch && <a className={styles.tapThrough} href={site.url} target="_blank" rel="noreferrer" aria-label={`Open ${site.title} live`} />}
      </div>
      {touch && <p className={styles.tapHint}>Tap the screen to open the live site ↗</p>}

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
