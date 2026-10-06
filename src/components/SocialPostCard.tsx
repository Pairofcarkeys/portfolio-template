'use client';

import type { CSSProperties, RefObject } from 'react';
import { FaGithub, FaInstagram, FaLinkedin, FaTiktok, FaXTwitter } from 'react-icons/fa6';
import { HiOutlineArrowPath, HiOutlineArrowTopRightOnSquare, HiOutlineBookmark, HiOutlineChatBubbleOvalLeft, HiOutlineChartBar, HiOutlineCodeBracket, HiOutlineHeart, HiOutlinePaperAirplane, HiOutlineStar, HiOutlineXMark } from 'react-icons/hi2';
import styles from './SocialPostCard.module.css';

export type SocialPost = {
  platform: string; label: string; profileUrl: string; status: string;
  name: string; handle: string; postUrl: string | null; date: string | null;
  text: string | null; observedAt?: string; mediaType?: string; avatar?: string; image: string | null; imageAlt?: string;
  title?: string; reason?: string; metrics: { label: string; value: number; observedAt?: string }[];
  grid?: { url: string; image: string; alt: string }[];
};
const logos = { linkedin: FaLinkedin, x: FaXTwitter, instagram: FaInstagram, github: FaGithub, tiktok: FaTiktok };
const metricIcons = { likes: HiOutlineHeart, reactions: HiOutlineHeart, comments: HiOutlineChatBubbleOvalLeft, replies: HiOutlineChatBubbleOvalLeft, reposts: HiOutlineArrowPath, stars: HiOutlineStar, forks: HiOutlineCodeBracket, views: HiOutlineChartBar, saves: HiOutlineBookmark };

export function SocialPostCard({ post, observedAt, panelRef, position, onClose, onEnter, onLeave, onBlur }: {
  post: SocialPost; observedAt: string; panelRef: RefObject<HTMLDivElement | null>;
  position: CSSProperties; onClose: () => void; onEnter: () => void; onLeave: () => void; onBlur: () => void;
}) {
  const Logo = logos[post.platform as keyof typeof logos];
  const showCoreMetrics = ['instagram', 'tiktok', 'linkedin'].includes(post.platform);
  const coreLabels = ['views', post.platform === 'linkedin' ? 'reactions' : 'likes', 'comments'];
  const metrics = showCoreMetrics
    ? [...coreLabels.map(label => ({
      label,
      value: post.metrics.find(metric => metric.label === label)?.value ?? null,
      observedAt: post.metrics.find(metric => metric.label === label)?.observedAt,
    })), ...post.metrics.filter(metric => !coreLabels.includes(metric.label))]
    : post.metrics;
  return (
    <div ref={panelRef} id={`social-preview-${post.platform}`} data-social-preview={post.platform}
      role="region" aria-label={`${post.label} ${post.status === 'post' ? 'post' : 'account'} preview`}
      className={`${styles.card} ${styles[post.platform]}`} style={position}
      onPointerEnter={onEnter} onPointerLeave={onLeave} onBlur={onBlur}>
      <div className={styles.chrome}>
        <span><Logo aria-hidden="true" /> {post.label}</span>
        <button type="button" aria-label={`Close ${post.label} preview`} onClick={onClose}><HiOutlineXMark aria-hidden="true" /></button>
      </div>
      <div className={styles.author}>
        {post.avatar ? <img src={post.avatar} alt="" width="40" height="40" className={styles.avatar} /> : <span className={styles.avatarFallback}><Logo aria-hidden="true" /></span>}
        <div><a href={post.profileUrl} target="_blank" rel="noopener noreferrer" className={styles.name}>{post.name}</a><div className={styles.handle}>{post.handle}</div>{post.date && <div className={styles.date}>{post.date}{post.platform === 'linkedin' && ' · Public'}</div>}</div>
      </div>
      {post.status === 'unavailable' ? <div className={styles.unavailable}><Logo aria-hidden="true" /><strong>Preview unavailable</strong><p>{post.reason}</p></div> : <>
        {post.platform === 'github' && <div className={styles.repoTitle}><HiOutlineCodeBracket aria-hidden="true" /><a href={post.postUrl!} target="_blank" rel="noopener noreferrer">{post.title}</a><span>Public</span></div>}
        {post.platform !== 'instagram' && <p className={styles.text}>{post.text}</p>}
        {post.image && <a href={post.postUrl!} target="_blank" rel="noopener noreferrer" className={styles.media} aria-label={`Open ${post.label} post`}><img src={post.image} alt={post.imageAlt || ''} width="640" height="640" />{(post.platform === 'x' || post.mediaType === 'video') && <span className={styles.play} aria-hidden="true">▶</span>}</a>}
        {post.platform === 'instagram' && <><div className={styles.instagramActions} aria-hidden="true"><HiOutlineHeart /><HiOutlineChatBubbleOvalLeft /><HiOutlinePaperAirplane /><HiOutlineBookmark /></div><p className={styles.caption}><strong>{post.name}</strong> {post.text}</p></>}
        {metrics.length > 0 && <ul className={`${styles.metrics} ${showCoreMetrics ? styles.coreMetrics : ''}`} aria-label="Post engagement">{metrics.map(metric => {
          const Icon = metricIcons[metric.label as keyof typeof metricIcons];
          const available = metric.value !== null && Number.isFinite(metric.value) && metric.value >= 0;
          return <li key={metric.label} title={available ? `Observed ${(metric.observedAt || post.observedAt || observedAt).slice(0, 10)}` : `${metric.label} count unavailable in this snapshot`}>
            {Icon && <Icon aria-hidden="true" />}
            <span><span className={styles.metricValue}>{available ? metric.value!.toLocaleString('en-US') : 'Unavailable'}</span>{' '}<span className={styles.metricLabel}>{metric.label}</span></span>
          </li>;
        })}</ul>}
        {post.grid && <div className={styles.more}><span>More from {post.name}</span><div className={styles.grid}>{post.grid.map(item => <a key={item.url} href={item.url} target="_blank" rel="noopener noreferrer"><img src={item.image} alt={item.alt} width="120" height="150" /></a>)}</div></div>}
      </>}
      <div className={styles.footer}><a href={post.postUrl || post.profileUrl} target="_blank" rel="noopener noreferrer">{post.status === 'repository' ? 'View repository' : post.status === 'unavailable' ? 'Visit linked account' : `View on ${post.label}`}<HiOutlineArrowTopRightOnSquare aria-hidden="true" /></a><small>Snapshot · {(post.observedAt || observedAt).slice(0, 10)}</small></div>
    </div>
  );
}
