import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile);
// Your GitHub username. Set GITHUB_USERNAME in the environment (or edit the fallback).
export const GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'your-username';
// GitHub's default contributionsCollection window is the trailing year.
export const queryFor = login => `query { user(login: ${JSON.stringify(login)}) { contributionsCollection { restrictedContributionsCount contributionCalendar { totalContributions weeks { contributionDays { date weekday contributionCount contributionLevel } } } } } }`;

export async function fetchContributions({ token = process.env.GITHUB_CONTRIBUTIONS_TOKEN, fetchImpl = globalThis.fetch, login = GITHUB_USERNAME } = {}) {
  const query = queryFor(login);
  try {
    if (token) {
      const response = await fetchImpl('https://api.github.com/graphql', {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/vnd.github+json' },
        body: JSON.stringify({ query }), signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) throw new Error('HTTP failure');
      return await response.json();
    }
    if (process.env.CI) throw new Error('Missing automation token');
    const { stdout } = await exec('gh', ['api', 'graphql', '-f', `query=${query}`], { timeout: 30000, maxBuffer: 2 * 1024 * 1024 });
    return JSON.parse(stdout);
  } catch {
    // Never echo API bodies, CLI stderr, request headers, or credentials.
    throw new Error('GitHub contribution fetch failed. Check GITHUB_CONTRIBUTIONS_TOKEN (required in CI), or local gh authentication. Snapshot unchanged.');
  }
}
