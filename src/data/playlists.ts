import data from './playlists.json';

export type Playlist = { id: string; name: string; url: string };
export type PlaylistTrack = {
  id: string;
  title: string;
  artist: string;
  /** Playlist ids the track appears in. */
  playlists: string[];
  /** Link for the cover art (track page on any music service). */
  url: string;
  /** Optional ~30 s audio preview URL. Empty string or null means no preview: the play button is disabled. */
  preview: string | null;
  durationMs: number | null;
  artwork: string;
};

export const playlists: Playlist[] = data.playlists;
export const playlistTracks: PlaylistTrack[] = data.tracks;
export const playlistOf = (track: PlaylistTrack) => playlists.find(entry => entry.id === track.playlists[0])!;
