/** SAMPLE DATA — the "Listening" card on the homepage. A silent design study: it never plays audio. */
export interface ListeningConfig {
  title: string;
  artist: string;
  artwork: string;
  artworkAlt: string;
  /** Where the artwork and title link to (a track page on any music service). */
  trackUrl: string;
  /** Optional playlist link shown as "Playlist ↗". Must be an https URL. */
  playlistUrl?: string;
}

export const listening: ListeningConfig = {
  title: 'Sample Track',
  artist: 'Example Artist',
  artwork: '/music/cover-1.svg',
  artworkAlt: 'Placeholder cover art',
  trackUrl: 'https://example.com',
};
