import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadComponent } from './helpers/load-component.mjs';

const render = (path, name, props = {}) => renderToStaticMarkup(React.createElement(loadComponent(path)[name], props));

test('the shuffle deck plays every item once per pass and never repeats back to back', () => {
  const { createShuffleDeck } = loadComponent('lib/shuffle-deck.ts');
  const ids = ['a', 'b', 'c', 'd', 'e'];
  let seed = 7;
  const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const deck = createShuffleDeck(ids, random);
  let current = ids[0];
  const seen = [];
  for (let i = 0; i < ids.length * 6; i++) {
    const next = deck.next(current);
    assert.notEqual(next, current);
    seen.push(next);
    current = next;
  }
  for (let pass = 1; pass < 6; pass++) {
    const chunk = seen.slice(pass * ids.length - 1, (pass + 1) * ids.length - 1);
    assert.ok(new Set(chunk).size >= ids.length - 1, `pass ${pass} repeats items`);
  }
  const single = createShuffleDeck(['only']);
  assert.equal(single.next('only'), 'only');
});

test('timeline table renders every entry with filters, sort buttons and search', () => {
  const { timeline, CATEGORIES } = loadComponent('data/timeline.ts');
  const html = render('components/Timeline.tsx', 'Timeline');
  assert.equal((html.match(/data-timeline-entry=/g) || []).length, timeline.length);
  for (const category of CATEGORIES) assert.ok(html.includes(category.label), category.label);
  for (const column of ['Date', 'Organisation', 'Role', 'Location', 'Type']) assert.ok(html.includes(`Sort by ${column}`), column);
  assert.match(html, /type="search"/);
  for (const entry of timeline) assert.ok(html.includes(`href="/timeline/${entry.id}"`), entry.id);
});

test('playlist player renders the first track and disables play when there is no preview', () => {
  const { playlistTracks } = loadComponent('data/playlists.ts');
  const { PlaylistPlayer } = loadComponent('components/PlaylistPlayer.tsx');
  const silent = { ...playlistTracks[0], preview: null };
  const html = renderToStaticMarkup(React.createElement(PlaylistPlayer, { tracks: [silent, playlistTracks[1]] }));
  assert.match(html, /data-mode="playlist-shuffle"/);
  assert.ok(html.includes(silent.artwork));
  assert.match(html, /aria-label="No preview available"[^>]*disabled/);
  assert.match(html, /Shuffle to another track/);
  assert.doesNotMatch(html, /<audio|<iframe|autoplay/);
  const withPreview = renderToStaticMarkup(React.createElement(PlaylistPlayer, { tracks: [{ ...silent, preview: 'https://example.com/preview.mp3' }] }));
  assert.match(withPreview, /Play 30-second preview/);
});

test('listening card is a silent visual study with a validated playlist link', () => {
  const { MusicPlayer } = loadComponent('components/MusicPlayer.tsx');
  const { listening } = loadComponent('data/listening.ts');
  const html = renderToStaticMarkup(React.createElement(MusicPlayer));
  assert.ok(html.includes(listening.title) && html.includes(listening.artwork));
  assert.match(html, /start visual preview animation/i);
  assert.doesNotMatch(html, /<audio|<iframe|autoplay/);
  const playlist = 'https://example.com/my-playlist';
  assert.ok(renderToStaticMarkup(React.createElement(MusicPlayer, { config: { ...listening, playlistUrl: playlist } })).includes(playlist));
  const rejected = renderToStaticMarkup(React.createElement(MusicPlayer, { config: { ...listening, playlistUrl: 'javascript:alert(1)' } }));
  assert.ok(!rejected.includes('javascript:'));
});

test('detail sections and the project notebook render from data', () => {
  const html = render('components/ExperienceDetail.tsx', 'ExperienceDetail', { id: 'project-one' });
  for (const heading of ['What I did', 'What I learned', 'Skills']) assert.ok(html.includes(heading), heading);
  const notebook = render('components/ProjectWriteup.tsx', 'ProjectWriteup', { id: 'project-one' });
  assert.match(notebook, /data-project-notebook="project-one"/);
  assert.equal(render('components/ProjectWriteup.tsx', 'ProjectWriteup', { id: 'no-such-entry' }), '');
});

test('header and footer read the profile', () => {
  const { fullName, profile } = loadComponent('data/profile.ts');
  const footer = render('components/Footer.tsx', 'Footer');
  assert.ok(footer.includes(fullName) && footer.includes(`mailto:${profile.email}`));
});
