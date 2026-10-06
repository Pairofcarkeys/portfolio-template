import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { loadComponent } from './helpers/load-component.mjs';

const json = path => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const asset = path => new URL(`../public${path}`, import.meta.url);
/** Local assets must exist; remote ones must be https. */
const assertAsset = (src, label) => {
  if (/^https:\/\//.test(src)) return;
  assert.match(src, /^\//, `${label}: ${src} must be an absolute public path or https URL`);
  assert.ok(existsSync(asset(src)), `${label}: missing public${src}`);
};

const { timeline, generatedDetailEntries, CATEGORIES } = loadComponent('data/timeline.ts');
const { experienceDetails } = loadComponent('data/experience-details.ts');
const { projects } = loadComponent('data/projects.ts');
const { projectWriteups } = loadComponent('data/project-writeups.ts');
const { profile } = loadComponent('data/profile.ts');

test('profile has the fields every page reads', () => {
  for (const key of ['firstName', 'lastName', 'role', 'company', 'companyEntryId', 'location', 'email', 'bio', 'githubUrl']) {
    assert.equal(typeof profile[key], 'string', key);
    assert.ok(profile[key].length, key);
  }
  assert.match(profile.email, /^[^@\s]+@[^@\s]+\.[^@\s]+$/);
  assert.ok(Number.isInteger(profile.sinceYear));
  assert.ok(timeline.some(entry => entry.id === profile.companyEntryId), 'companyEntryId must be a timeline id');
});

test('timeline entries are unique, well-formed and cover every category', () => {
  const ids = new Set();
  for (const entry of timeline) {
    assert.ok(!ids.has(entry.id), `${entry.id}: duplicate id`);
    ids.add(entry.id);
    assert.match(entry.id, /^[a-z0-9-]+$/, entry.id);
    assert.ok(CATEGORIES.some(category => category.id === entry.category), `${entry.id}: unknown category`);
    assert.ok(entry.title && entry.dateLabel && entry.location, entry.id);
    assert.ok(entry.bullets[0] && entry.bullets[1], `${entry.id}: needs a role and a fact`);
    assert.equal(entry.href, `/timeline/${entry.id}`);
    assert.ok(entry.end === null || entry.end >= entry.start, `${entry.id}: ends before it starts`);
    if (entry.logo) assertAsset(entry.logo, entry.id);
  }
  for (const category of CATEGORIES) assert.ok(timeline.some(entry => entry.category === category.id), `${category.id}: empty category`);
  const order = timeline.map(entry => entry.sortKey ?? entry.start);
  assert.deepEqual(order, [...order].sort((a, b) => b - a), 'timeline must be newest first');
});

test('every detail page has its written sections, and project media exists', () => {
  for (const entry of generatedDetailEntries) {
    const detail = experienceDetails[entry.id];
    assert.ok(detail, `${entry.id}: missing experience-details entry`);
    assert.ok(detail.did.length > 30 && detail.learned.length > 10, entry.id);
    assert.ok(detail.skills.length > 0, entry.id);
  }
  for (const id of Object.keys(experienceDetails)) assert.ok(generatedDetailEntries.some(entry => entry.id === id), `${id}: detail without a timeline entry`);
  for (const project of projects) {
    for (const src of [project.hero, ...(project.images ?? [])].filter(Boolean)) assertAsset(src, project.slug);
    for (const link of project.external ?? []) assert.match(link.href, /^https:\/\//, project.slug);
  }
  for (const [id, writeup] of Object.entries(projectWriteups)) {
    assert.ok(timeline.some(entry => entry.id === id), `${id}: write-up without a timeline entry`);
    for (const block of writeup.blocks) if (block.type === 'image') assertAsset(block.src, id);
  }
});

test('design work: every site is grouped, https, and has a poster and favicon', () => {
  const data = json('src/data/design-work.json');
  const groups = new Set(data.groups.map(group => group.id));
  const ids = new Set();
  assert.ok(data.sites.length >= 2, 'the shuffle needs at least two sites');
  for (const site of data.sites) {
    assert.ok(groups.has(site.group), `${site.id}: unknown group ${site.group}`);
    assert.ok(!ids.has(site.id), `${site.id}: duplicate id`);
    ids.add(site.id);
    assert.match(site.url, /^https:\/\//, site.id);
    assert.equal(typeof site.concept, 'boolean', site.id);
    const poster = asset(`/design-work/${site.id}.jpg`);
    assert.equal(readFileSync(poster).subarray(0, 3).toString('hex'), 'ffd8ff', `${site.id}: poster is not a JPEG`);
    assert.ok(statSync(poster).size < 1024 * 1024, `${site.id}: poster over 1 MB`);
    assert.equal(readFileSync(asset(`/design-work/${site.id}-icon.png`)).subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${site.id}: favicon is not a PNG`);
  }
  for (const group of groups) assert.ok(data.sites.some(site => site.group === group), `${group}: empty group`);
});

test('the rigged laptop model ships with its required attribution', () => {
  const model = readFileSync(asset('/models/macbook-rigged.glb'));
  assert.equal(model.toString('ascii', 0, 4), 'glTF');
  const chunk = JSON.parse(model.subarray(20, 20 + model.readUInt32LE(12)).toString());
  assert.ok(chunk.nodes.some(node => node.name === 'LidPivot') && chunk.nodes.some(node => node.name === 'Screen'));
  const page = readFileSync(new URL('../src/app/work/page.tsx', import.meta.url), 'utf8');
  assert.match(page, /jackbaeten/);
  assert.match(page, /CC BY 4\.0/);
  assert.match(page, /William Laverty/);
});

test('playlists: unique tracks, known playlists, artwork present, previews optional', () => {
  const data = json('src/data/playlists.json');
  assert.ok(data.playlists.length >= 1);
  const ids = new Set(data.playlists.map(playlist => playlist.id));
  for (const playlist of data.playlists) assert.match(playlist.url, /^https:\/\//);
  assert.ok(data.tracks.length >= 2);
  assert.equal(new Set(data.tracks.map(track => track.id)).size, data.tracks.length);
  for (const track of data.tracks) {
    assert.ok(track.title && track.artist, track.id);
    assert.ok(track.playlists.length && track.playlists.every(id => ids.has(id)), track.id);
    assert.match(track.url, /^https:\/\//, track.id);
    assert.ok(track.preview === null || track.preview === '' || /^https:\/\//.test(track.preview), `${track.id}: preview must be https or empty`);
    assertAsset(track.artwork, track.id);
  }
  const { listening } = loadComponent('data/listening.ts');
  assertAsset(listening.artwork, 'listening');
});

test('social previews: one card per contact icon with existing media', () => {
  const data = json('src/data/social-previews.json');
  assert.ok(data.cards.length > 0);
  for (const card of data.cards) {
    assert.ok(['linkedin', 'x', 'instagram', 'tiktok'].includes(card.platform), card.platform);
    assert.match(card.profileUrl, /^https:\/\//, card.platform);
    for (const src of [card.avatar, card.image].filter(Boolean)) assertAsset(src, card.platform);
    for (const metric of card.metrics) assert.ok(Number.isSafeInteger(metric.value) && metric.value >= 0, `${card.platform}: ${metric.label}`);
  }
});

test('social stats snapshot summarises into the published allowlisted summary', async () => {
  const { summarizeSocialStats, isSocialSummary } = await import('../src/lib/social-summary.mjs');
  const summary = summarizeSocialStats(json('src/data/social-stats.json'));
  assert.ok(isSocialSummary(summary));
  assert.deepEqual(json('public/social-summary.json'), summary);
  assert.equal(summarizeSocialStats({ schemaVersion: 2 }), null);
});
