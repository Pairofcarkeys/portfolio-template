// Refresh every live data source the site shows, then validate each one.
// Run: pnpm refresh  (CI runs the same thing on every push to main and daily)
//
// Each source is independent and fail-soft: a source that is missing
// credentials, errors, or produces data its tests reject is restored to the
// committed snapshot, so a flaky upstream never blocks a deploy.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const hasGitHub = Boolean(process.env.GITHUB_CONTRIBUTIONS_TOKEN) || spawnSync('gh', ['auth', 'status'], { stdio: 'ignore' }).status === 0;

const sources = [
  {
    name: 'Spotify playlists',
    run: ['python3', 'scripts/sync-playlists.py'],
    files: ['src/data/playlists.json'],
    test: 'tests/data.test.mjs',
    skip: !process.env.SPOTIFY_PLAYLIST_IDS && 'no SPOTIFY_PLAYLIST_IDS',
  },
  {
    name: 'GitHub contributions',
    run: ['node', 'scripts/sync-contributions.mjs'],
    files: ['src/data/github-contributions.json'],
    test: 'tests/contributions.test.mjs',
    skip: !process.env.GITHUB_USERNAME ? 'no GITHUB_USERNAME'
      : !hasGitHub && 'no GITHUB_CONTRIBUTIONS_TOKEN or gh login',
  },
];

const exec = ([command, ...args]) => spawnSync(command, args, { stdio: 'inherit', timeout: 15 * 60_000 }).status === 0;
const runTest = path => exec(path.endsWith('.py') ? ['python3', path] : ['node', '--test', path]);

const results = [];
for (const source of sources) {
  if (source.skip) { results.push([source.name, `skipped (${source.skip})`]); continue; }
  const snapshot = new Map(source.files.filter(existsSync).map(path => [path, readFileSync(path)]));
  console.log(`\n▸ ${source.name}`);
  const ok = exec(source.run) && (!source.after || exec(source.after)) && runTest(source.test);
  if (!ok) for (const [path, contents] of snapshot) writeFileSync(path, contents);
  results.push([source.name, ok ? 'refreshed' : 'failed, kept last snapshot']);
}

console.log('\nData refresh');
for (const [name, status] of results) console.log(`  ${status.startsWith('refreshed') ? '✓' : status.startsWith('skipped') ? '·' : '✗'} ${name}: ${status}`);
