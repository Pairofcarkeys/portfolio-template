'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { playlistOf, playlistTracks, type PlaylistTrack } from '@/data/playlists';
import { createShuffleDeck } from '@/lib/shuffle-deck';
import styles from './MusicPlayer.module.css';

/** Idle covers rotate this often before anyone presses play. */
const IDLE_MS = 7000;

/**
 * Shuffles the tracks in src/data/playlists.json. Press play to hear a track's
 * preview; when one ends, a random next track follows. Tracks without a
 * preview still show and shuffle, with the play button disabled.
 */
export function PlaylistPlayer({ tracks = playlistTracks }: { tracks?: PlaylistTrack[] }) {
  const id = useId();
  const deck = useRef(createShuffleDeck(tracks));
  const audio = useRef<HTMLAudioElement | null>(null);
  // Server and first client render agree on the first track; the shuffle starts after mount.
  const [track, setTrack] = useState(tracks[0]);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [idle, setIdle] = useState(true);

  const advance = useCallback(() => setTrack(current => deck.current.next(current)), []);

  useEffect(() => {
    advance();
    const element = new Audio();
    element.preload = 'none';
    audio.current = element;
    const time = () => setProgress(element.duration ? element.currentTime / element.duration : 0);
    const ended = () => advance();
    // A dead preview link skips ahead rather than stalling the shuffle.
    const failed = () => { if (element.src) advance(); };
    const sync = () => setPlaying(!element.paused);
    element.addEventListener('timeupdate', time);
    element.addEventListener('ended', ended);
    element.addEventListener('error', failed);
    element.addEventListener('play', sync);
    element.addEventListener('pause', sync);
    return () => { element.pause(); element.removeAttribute('src'); audio.current = null; };
  }, [advance]);

  // New track: load it, and keep playing if we were.
  useEffect(() => {
    const element = audio.current;
    if (!element) return;
    const wasPlaying = !element.paused;
    setProgress(0);
    if (!track.preview) {
      // No preview for this track: stop cleanly instead of loading an empty source.
      element.pause();
      element.removeAttribute('src');
      return;
    }
    element.src = track.preview;
    if (wasPlaying || !idle) void element.play().catch(() => setPlaying(false));
  }, [track]); // eslint-disable-line react-hooks/exhaustive-deps

  // Before the first play, quietly rotate covers so the section feels alive.
  useEffect(() => {
    if (!idle || playing || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setTimeout(advance, IDLE_MS);
    return () => clearTimeout(timer);
  }, [idle, playing, track, advance]);

  const toggle = () => {
    const element = audio.current;
    if (!element || !track.preview) return;
    setIdle(false);
    if (element.paused) void element.play().catch(() => setPlaying(false));
    else element.pause();
  };
  const restart = () => { if (audio.current) audio.current.currentTime = 0; };
  const skip = () => { setIdle(false); advance(); };
  const playlist = playlistOf(track);
  const hasPreview = Boolean(track.preview);

  return (
    <section className={styles.player} aria-labelledby={`${id}-title`} data-music-player data-mode="playlist-shuffle" data-size="large" data-playing={playing}>
      <h2 id={`${id}-title`} className={styles.srOnly}>What I&apos;m listening to right now</h2>
      <a className={styles.artwork} href={track.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${track.title} by ${track.artist}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={track.id} className={styles.cover} src={track.artwork} alt={`Cover art for ${track.title} by ${track.artist}`} width={300} height={300} />
      </a>
      <div className={styles.body}>
        <div className={styles.track} aria-live="polite">
          <span key={track.id} className={styles.title}>{track.title}</span>
          <span className={styles.artist}>{track.artist}</span>
          <span className={styles.source}>From “{playlist.name}”</span>
        </div>
        <div className={styles.ink} aria-hidden="true">
          <span className={styles.knob} data-live="true" style={{ left: `calc(${progress} * (100% - 9px))` }} />
        </div>
        <div className={styles.row}>
          <div className={styles.transport} role="group" aria-label="Preview controls">
            <button type="button" aria-label="Restart track preview" onClick={restart} disabled={!hasPreview}>
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3h1.6v10H3zM13 3v10L5.5 8z" /></svg>
            </button>
            <button type="button" aria-label={!hasPreview ? 'No preview available' : playing ? 'Pause preview' : 'Play 30-second preview'} aria-pressed={playing} onClick={toggle} disabled={!hasPreview} title={hasPreview ? undefined : 'No preview available'}>
              <svg viewBox="0 0 16 16" aria-hidden="true">{playing ? <path d="M4 3h3v10H4zM9 3h3v10H9z" /> : <path d="M4.5 2.5v11L13 8z" />}</svg>
            </button>
            <button type="button" aria-label="Shuffle to another track" onClick={skip}>
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3v10l7.5-5zM11.4 3H13v10h-1.6z" /></svg>
            </button>
          </div>
          <div className={styles.meta}><a href={playlist.url} target="_blank" rel="noopener noreferrer">Playlist ↗</a></div>
        </div>
      </div>
    </section>
  );
}
