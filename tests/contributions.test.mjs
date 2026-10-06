import test from 'node:test';
import { loadComponent } from './helpers/load-component.mjs';
import assert from 'node:assert/strict';

// Deliberately synthetic unit fixture; the published snapshot is fetched live.
function response() {
  const days = Array.from({ length: 365 }, (_, index) => {
    const date = new Date(Date.UTC(2025, 8, 9 + index));
    return { date: date.toISOString().slice(0, 10), weekday: date.getUTCDay(), contributionCount: index === 0 ? 2 : 0, contributionLevel: index === 0 ? 'FIRST_QUARTILE' : 'NONE', repository: 'private-name-never-publish' };
  });
  const weeks = [];
  for (const day of days) {
    if (!weeks.length || day.weekday === 0) weeks.push({ contributionDays: [] });
    weeks.at(-1).contributionDays.push(day);
  }
  return { data: { user: { email: 'private@example.com', contributionsCollection: { restrictedContributionsCount: 2, secret: 'secret-token-never-publish', contributionCalendar: { totalContributions: 2, weeks } } } } };
}
import { normalizeContributions } from '../scripts/lib/contributions.mjs';

const fetchedAt = '2026-09-08T12:00:00.000Z';

test('normalizes an annual calendar with an explicit privacy allowlist', async () => {
  const lib = await import('../scripts/lib/contributions.mjs').catch(() => ({}));
  assert.equal(typeof lib.normalizeContributions, 'function', 'normalizer must exist');
  const snapshot = lib.normalizeContributions(response(), fetchedAt);
  assert.deepEqual(Object.keys(snapshot).sort(), ['days', 'fetchedAt', 'range', 'restrictedContributionsCount', 'totalContributions'].sort());
  assert.deepEqual(snapshot.range, { start: '2025-09-09', end: '2026-09-08' });
  assert.equal(snapshot.days.length, 365);
  assert.deepEqual(snapshot.days[0], { date: '2025-09-09', weekday: 2, count: 2, level: 1 });
  assert.equal(snapshot.totalContributions, 2);
  assert.equal(snapshot.restrictedContributionsCount, 2);
  assert.equal(snapshot.fetchedAt, fetchedAt);
  assert.doesNotMatch(JSON.stringify(snapshot), /private|secret|repository|email/);
});


test('rejects malformed or inconsistent upstream calendars without leaking response content', () => {
  const mutations = [
    x => { x.errors = [{ message: 'secret-token-never-publish' }]; },
    x => { x.data.user = null; },
    x => { x.data.user.contributionsCollection.restrictedContributionsCount = -1; },
    x => { x.data.user.contributionsCollection.contributionCalendar.totalContributions = 99; },
    x => { x.data.user.contributionsCollection.contributionCalendar.weeks.pop(); },
    x => { x.data.user.contributionsCollection.contributionCalendar.weeks[0].contributionDays[0].date = '2025-02-30'; },
    x => { x.data.user.contributionsCollection.contributionCalendar.weeks[0].contributionDays[0].weekday = 5; },
    x => { x.data.user.contributionsCollection.contributionCalendar.weeks[0].contributionDays[0].contributionCount = -1; },
    x => { x.data.user.contributionsCollection.contributionCalendar.weeks[0].contributionDays[0].contributionLevel = 'SECRET'; },
    x => { x.data.user.contributionsCollection.contributionCalendar.weeks[0].contributionDays[0].contributionLevel = 'NONE'; },
    x => { x.data.user.contributionsCollection.contributionCalendar.weeks[1].contributionDays[0].date = '2025-09-09'; },
  ];
  for (const mutate of mutations) {
    const input = response(); mutate(input);
    assert.throws(() => normalizeContributions(input, fetchedAt), error => error.message.startsWith('Invalid contribution') && !error.message.includes('secret'));
  }
  assert.throws(() => normalizeContributions(response(), 'not-a-date'), /Invalid contribution/);
});


test('atomic writer validates before replacing a snapshot and leaves no temporary files', async () => {
  const lib = await import('../scripts/lib/contributions.mjs');
  assert.equal(typeof lib.writeSnapshot, 'function', 'atomic writer must exist');
  const { mkdtemp, readFile, readdir, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const dir = await mkdtemp(join(tmpdir(), 'contributions-test-'));
  try {
    const path = join(dir, 'snapshot.json');
    const snapshot = normalizeContributions(response(), fetchedAt);
    await lib.writeSnapshot(path, snapshot);
    assert.deepEqual(JSON.parse(await readFile(path, 'utf8')), snapshot);
    await assert.rejects(lib.writeSnapshot(path, { ...snapshot, token: 'do-not-persist' }), /Invalid contribution/);
    assert.deepEqual(JSON.parse(await readFile(path, 'utf8')), snapshot);
    assert.deepEqual(await readdir(dir), ['snapshot.json']);
  } finally { await rm(dir, { recursive: true, force: true }); }
});


test('fetches only aggregate fields with the automation token and suppresses upstream errors', async () => {
  const lib = await import('../scripts/lib/fetch-contributions.mjs').catch(() => ({}));
  assert.equal(typeof lib.fetchContributions, 'function');
  let request;
  const fetchImpl = async (url, options) => { request = { url, ...options }; return { ok: true, json: async () => response() }; };
  assert.deepEqual(await lib.fetchContributions({ token: 'test-only-token', fetchImpl }), response());
  assert.equal(request.url, 'https://api.github.com/graphql');
  assert.equal(request.headers.Authorization, 'Bearer test-only-token');
  const query = JSON.parse(request.body).query;
  assert.match(query, /restrictedContributionsCount/);
  assert.doesNotMatch(query, /repositories|commitContributions|pullRequestContributions|email/);
  await assert.rejects(lib.fetchContributions({ token: 'test-only-token', fetchImpl: async () => { throw new Error('test-only-token'); } }), error => !error.message.includes('test-only-token'));
});


test('refuses to replace known private aggregates with a public-only response', async () => {
  const { assertPrivateCoverage } = await import('../scripts/lib/contributions.mjs');
  assert.equal(typeof assertPrivateCoverage, 'function');
  const previous = normalizeContributions(response(), fetchedAt);
  assert.throws(() => assertPrivateCoverage({ ...previous, restrictedContributionsCount: 0 }, previous), /credentials.*private/i);
  assert.doesNotThrow(() => assertPrivateCoverage(previous, previous));
});

test('server renders every day with accessible counts, seven weekday rows across full-year weeks and profile link', async () => {
  const { readFile } = await import('node:fs/promises');
  const React = (await import('react')).default;
  const { renderToStaticMarkup } = await import('react-dom/server');
  const source = await readFile(new URL('../src/components/ContributionCalendar.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /["']use client["']/);
  const snapshot = JSON.parse(await readFile(new URL('../src/data/github-contributions.json', import.meta.url), 'utf8'));
  const { profile } = loadComponent('data/profile.ts');
  const Calendar = loadComponent('components/ContributionCalendar.tsx', { '../data/github-contributions.json': snapshot }).default;
  const html = renderToStaticMarkup(React.createElement(Calendar));
  assert.equal((html.match(/data-date=/g) || []).length, snapshot.days.length);
  const weeks = Math.ceil((snapshot.days.length + snapshot.days[0].weekday) / 7);
  assert.equal((html.match(/data-weekday=/g) || []).length, 7);
  assert.equal((html.match(/data-calendar-grid="horizontal"/g) || []).length, 1);
  assert.equal((html.match(/role="columnheader"/g) || []).length, weeks);
  assert.equal((html.match(/role="rowheader"/g) || []).length, 7);
  assert.ok(html.includes(`href="${profile.githubUrl}"`));
  assert.match(html, /Updated/);
  assert.match(html, /Less/);
  assert.match(html, /More/);
  for (const day of snapshot.days) assert.ok(html.includes(`data-date="${day.date}"`));
});

test('the committed sample snapshot passes the same validation as a synced one', async () => {
  const { validateSnapshot } = await import('../scripts/lib/contributions.mjs');
  const { readFile } = await import('node:fs/promises');
  const committed = JSON.parse(await readFile(new URL('../src/data/github-contributions.json', import.meta.url), 'utf8'));
  assert.doesNotThrow(() => validateSnapshot(committed));
});

test('the GitHub username is configuration, not code', async () => {
  const { queryFor } = await import('../scripts/lib/fetch-contributions.mjs');
  assert.match(queryFor('octocat'), /user\(login: "octocat"\)/);
});
