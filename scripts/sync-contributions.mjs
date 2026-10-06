import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { normalizeContributions, validateSnapshot, assertPrivateCoverage, writeSnapshot } from './lib/contributions.mjs';
import { fetchContributions } from './lib/fetch-contributions.mjs';

const path = fileURLToPath(new URL('../src/data/github-contributions.json', import.meta.url));
try {
  let previous;
  try { previous = validateSnapshot(JSON.parse(await readFile(path, 'utf8'))); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const snapshot = normalizeContributions(await fetchContributions());
  assertPrivateCoverage(snapshot, previous);
  await writeSnapshot(path, snapshot);
  console.log(`Updated contribution snapshot: ${snapshot.totalContributions} contributions, ${snapshot.restrictedContributionsCount} private aggregates, across ${snapshot.days.length} days (${snapshot.range.start}–${snapshot.range.end}).`);
} catch (error) {
  // Only our fixed diagnostic is surfaced; never remote error bodies or tokens.
  console.error(error.message === 'Credentials needed for private contribution aggregates; snapshot unchanged.'
    ? 'Credentials needed for private contribution aggregates; snapshot unchanged. Configure the CONTRIBUTIONS_TOKEN Actions secret with access to the profile private activity.'
    : 'Contribution sync failed; existing snapshot preserved. Check GitHub authentication, token permissions, and the aggregate calendar response.');
  process.exitCode = 1;
}
