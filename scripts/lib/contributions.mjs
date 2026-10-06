import { mkdir, open, rename, rm } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

export async function writeSnapshot(path, snapshot) {
  const content = `${JSON.stringify(validateSnapshot(snapshot), null, 2)}\n`;
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    const handle = await open(temporary, 'wx', 0o644);
    try { await handle.writeFile(content, 'utf8'); await handle.sync(); }
    finally { await handle.close(); }
    await rename(temporary, path);
  } finally { await rm(temporary, { force: true }); }
}

const levels = ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'];
const fail = () => { throw new Error('Invalid contribution data; existing snapshot was not changed.'); };
const integer = n => Number.isSafeInteger(n) && n >= 0;
const exactKeys = (value, keys) => value && typeof value === 'object' && Object.keys(value).sort().join(',') === [...keys].sort().join(',');
const dateMs = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const ms = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === value ? ms : NaN;
};

export function assertPrivateCoverage(next, previous) {
  if (previous?.restrictedContributionsCount > 0 && next.restrictedContributionsCount === 0) {
    throw new Error('Credentials needed for private contribution aggregates; snapshot unchanged.');
  }
}

export function validateSnapshot(snapshot) {
  if (!exactKeys(snapshot, ['fetchedAt', 'range', 'totalContributions', 'restrictedContributionsCount', 'days']) ||
      !exactKeys(snapshot.range, ['start', 'end']) ||
      typeof snapshot.fetchedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(snapshot.fetchedAt) || !Number.isFinite(Date.parse(snapshot.fetchedAt)) ||
      !integer(snapshot.totalContributions) || !integer(snapshot.restrictedContributionsCount) || snapshot.restrictedContributionsCount > snapshot.totalContributions ||
      !Array.isArray(snapshot.days) || snapshot.days.length < 365 || snapshot.days.length > 372) fail();
  let previous;
  let total = 0;
  for (const day of snapshot.days) {
    if (!exactKeys(day, ['date', 'weekday', 'count', 'level'])) fail();
    const ms = dateMs(day.date);
    if (!Number.isFinite(ms) || (previous !== undefined && ms - previous !== 86400000) ||
        day.weekday !== new Date(ms).getUTCDay() || !integer(day.count) || !integer(day.level) || day.level > 4 ||
        (day.count === 0) !== (day.level === 0)) fail();
    previous = ms;
    total += day.count;
  }
  if (snapshot.range.start !== snapshot.days[0].date || snapshot.range.end !== snapshot.days.at(-1).date ||
      total !== snapshot.totalContributions || dateMs(snapshot.range.end) > Date.parse(snapshot.fetchedAt)) fail();
  return snapshot;
}

export function normalizeContributions(response, fetchedAt = new Date().toISOString()) {
  try {
    if (response.errors?.length) fail();
    const collection = response.data.user.contributionsCollection;
    const calendar = collection.contributionCalendar;
    if (!Array.isArray(calendar.weeks) || calendar.weeks.length < 52 || calendar.weeks.length > 54) fail();
    const days = calendar.weeks.flatMap((week, index) => {
      if (!Array.isArray(week.contributionDays) || !week.contributionDays.length || week.contributionDays.length > 7 ||
          (index > 0 && week.contributionDays[0].weekday !== 0) ||
          (index < calendar.weeks.length - 1 && week.contributionDays.at(-1).weekday !== 6)) fail();
      return week.contributionDays.map(day => ({ date: day.date, weekday: day.weekday, count: day.contributionCount, level: levels.indexOf(day.contributionLevel) }));
    });
    return validateSnapshot({ fetchedAt, range: { start: days[0].date, end: days.at(-1).date }, totalContributions: calendar.totalContributions, restrictedContributionsCount: collection.restrictedContributionsCount, days });
  } catch { fail(); }
}
