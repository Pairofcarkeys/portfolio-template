'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { FaInstagram, FaLinkedin, FaTiktok, FaXTwitter } from 'react-icons/fa6';
import { HiOutlineEnvelope } from 'react-icons/hi2';
import snapshot from '../data/social-previews.json';
import { SocialPostCard } from './SocialPostCard';
import { profile } from '@/data/profile';
import styles from './Socials.module.css';

const icons = { linkedin: FaLinkedin, x: FaXTwitter, instagram: FaInstagram, tiktok: FaTiktok };

export function Socials() {
  const [active, setActive] = useState<string | null>(null);
  const [position, setPosition] = useState<CSSProperties>({ visibility: 'hidden' });
  const links = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchOpened = useRef<string | null>(null);
  const touchTap = useRef(false);
  const suppressFocus = useRef(false);
  const cancelClose = useCallback(() => { if (timer.current) clearTimeout(timer.current); }, []);
  const close = useCallback((restoreFocus = false) => {
    cancelClose();
    if (restoreFocus && active) {
      suppressFocus.current = true;
      links.current?.querySelector<HTMLAnchorElement>(`[data-social-icon="${active}"]`)?.focus();
      suppressFocus.current = false;
    }
    setActive(null);
    touchOpened.current = null;
  }, [active, cancelClose]);
  const scheduleClose = () => {
    cancelClose();
    timer.current = setTimeout(() => {
      if (!panel.current?.contains(document.activeElement) && !links.current?.contains(document.activeElement) && !touchOpened.current) setActive(null);
    }, 200);
  };
  const checkBlur = () => {
    // Wait until the browser has moved focus, including into the portaled card.
    requestAnimationFrame(() => {
      if (!panel.current?.contains(document.activeElement) && !links.current?.contains(document.activeElement)) close();
    });
  };
  useEffect(() => () => cancelClose(), [cancelClose]);
  useEffect(() => {
    if (!active) return;
    const keydown = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); close(true); } };
    const outside = (event: PointerEvent) => {
      if (!panel.current?.contains(event.target as Node) && !links.current?.contains(event.target as Node)) close();
    };
    document.addEventListener('keydown', keydown);
    document.addEventListener('pointerdown', outside);
    return () => { document.removeEventListener('keydown', keydown); document.removeEventListener('pointerdown', outside); };
  }, [active, close]);
  useLayoutEffect(() => {
    if (!active) return;
    const update = () => {
      const anchor = links.current?.querySelector(`[data-social-icon="${active}"]`);
      if (!anchor) return;
      const box = anchor.getBoundingClientRect();
      const width = Math.min(352, window.innerWidth - 24);
      const maxHeight = Math.min(600, window.innerHeight - 32);
      const height = Math.min(panel.current?.scrollHeight || maxHeight, maxHeight);
      const below = window.innerHeight - box.bottom - 12;
      const top = below >= height ? box.bottom + 8 : Math.max(16, box.top - height - 8);
      setPosition({ left: Math.max(12, Math.min(box.left, window.innerWidth - width - 12)), top, maxHeight, visibility: 'visible' });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => { window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true); };
  }, [active]);
  const post = snapshot.cards.find(card => card.platform === active);

  return (
    <section className={styles.socials} aria-labelledby="socials-heading" onKeyDown={event => {
      if (event.key !== 'Tab' || !panel.current?.contains(event.target as Node)) return;
      const stops = Array.from(panel.current.querySelectorAll<HTMLElement>('button, a[href]'));
      if (event.shiftKey && event.target === stops[0]) {
        event.preventDefault();
        links.current?.querySelector<HTMLAnchorElement>(`[data-social-icon="${active}"]`)?.focus();
      } else if (!event.shiftKey && event.target === stops.at(-1)) {
        event.preventDefault();
        const triggers = Array.from(links.current?.querySelectorAll<HTMLAnchorElement>('a') || []);
        const index = triggers.findIndex(link => link.dataset.socialIcon === active);
        const next = triggers[index + 1] || links.current?.parentElement?.querySelector<HTMLAnchorElement>('a[href^="mailto:"]');
        close();
        next?.focus();
      }
    }}>
      <h2 id="socials-heading" className={styles.srOnly}>Contact links</h2>
      <p id="social-preview-help" className={styles.srOnly}>Focus or hover for a preview. Press Arrow Down to enter it, Escape to dismiss. On touch screens, tap once to preview and again to visit.</p>
      <div className={styles.contacts}>
      <div className={styles.links} ref={links}>
        {snapshot.cards.map(({ platform, label, profileUrl }) => {
          const Icon = icons[platform as keyof typeof icons];
          return <a key={platform} href={profileUrl} data-social-icon={platform} aria-label={label} aria-describedby="social-preview-help"
            aria-expanded={active === platform} aria-controls={active === platform ? `social-preview-${platform}` : undefined}
            target="_blank" rel="me noopener noreferrer"
            onPointerEnter={event => { if (event.pointerType !== 'touch') { cancelClose(); setActive(platform); } }}
            onPointerLeave={scheduleClose}
            onFocus={() => { if (!suppressFocus.current) { cancelClose(); setActive(platform); } }} onBlur={checkBlur}
            onPointerDown={event => { touchTap.current = event.pointerType === 'touch'; }}
            onClick={event => {
              if (touchTap.current && touchOpened.current !== platform) { event.preventDefault(); touchOpened.current = platform; setActive(platform); }
              touchTap.current = false;
            }}
            onKeyDown={event => {
              if (event.key === 'ArrowDown') { event.preventDefault(); setActive(platform); requestAnimationFrame(() => panel.current?.querySelector<HTMLButtonElement>('button')?.focus()); }
              // The portaled preview follows the trigger in the keyboard journey.
              if (event.key === 'Tab' && !event.shiftKey && active === platform && panel.current) { event.preventDefault(); panel.current.querySelector<HTMLButtonElement>('button')?.focus(); }
            }}><Icon aria-hidden="true" /><span className={styles.name}>{label}</span><span className={styles.arrow} aria-hidden="true">↗</span></a>;
        })}
      </div>
      <a className={styles.email} href={`mailto:${profile.email}`}><HiOutlineEnvelope aria-hidden="true" /><span>{profile.email}</span><span className={styles.arrow} aria-hidden="true">→</span></a>
      </div>
      {post && createPortal(<SocialPostCard post={post} observedAt={snapshot.observedAt} panelRef={panel} position={position}
        onClose={() => close(true)} onEnter={cancelClose} onLeave={scheduleClose} onBlur={checkBlur} />, document.body)}
    </section>
  );
}
