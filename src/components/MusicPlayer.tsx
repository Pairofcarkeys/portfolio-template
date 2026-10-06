'use client';

import { useId, useState } from 'react';
import { listening, type ListeningConfig } from '@/data/listening';
import styles from './MusicPlayer.module.css';

/** Silent design study. Transport controls operate the drawing, never audio. */
export function MusicPlayer({ config = listening, size = 'default' }: { config?: ListeningConfig; size?: 'default' | 'large' }) {
  const id = useId();
  const [running, setRunning] = useState(false);
  const [pass, setPass] = useState(0);
  const [artFailed, setArtFailed] = useState(false);
  const playlistUrl = config.playlistUrl && /^https:\/\/[^\s/]+\.[^\s/]+(?:\/\S*)?$/.test(config.playlistUrl)
    ? config.playlistUrl : undefined;
  return (
    <section className={styles.player} aria-labelledby={`${id}-title`} data-music-player data-mode="visual-preview" data-size={size}>
      <h2 id={`${id}-title`} className={styles.srOnly}>What I&apos;m listening to right now</h2>
      <a className={styles.artwork} href={config.trackUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open ${config.title} by ${config.artist}`}>
        {artFailed ? <span className={styles.fallback}>Artwork unavailable<br />{config.artist}</span> :
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={config.artwork} alt={config.artworkAlt} width={300} height={300} onError={() => setArtFailed(true)} />}
      </a>
      <div className={styles.body}>
        <div className={styles.track}><span>{config.title}</span><span className={styles.artist}>{config.artist}</span></div>
        <div className={styles.ink} data-running={running} key={pass} aria-hidden="true">
          <span className={styles.knob} />
        </div>
        <div className={styles.row}>
          <div className={styles.transport} role="group" aria-label="Visual preview animation controls">
            <button type="button" aria-label="Restart visual preview animation" onClick={() => setPass(p => p + 1)}>
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3h1.6v10H3zM13 3v10L5.5 8z" /></svg>
            </button>
            <button type="button" aria-label={running ? 'Pause visual preview animation' : 'Start visual preview animation'} aria-pressed={running} onClick={() => setRunning(value => !value)}>
              <svg viewBox="0 0 16 16" aria-hidden="true">{running ? <path d="M4 3h3v10H4zM9 3h3v10H9z" /> : <path d="M4.5 2.5v11L13 8z" />}</svg>
            </button>
            <button type="button" aria-label="Replay visual preview animation" onClick={() => { setPass(p => p + 1); setRunning(true); }}>
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3v10l7.5-5zM11.4 3H13v10h-1.6z" /></svg>
            </button>
          </div>
          <div className={styles.meta}><a href={playlistUrl ?? config.trackUrl} target="_blank" rel="noopener noreferrer">{playlistUrl ? 'Playlist ↗' : 'Listen ↗'}</a></div>
        </div>
      </div>
    </section>
  );
}
