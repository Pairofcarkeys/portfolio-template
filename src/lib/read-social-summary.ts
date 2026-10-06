import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { summarizeSocialStats } from './social-summary.mjs';

export function readSocialSummary() {
  try {
    return summarizeSocialStats(JSON.parse(readFileSync(join(process.cwd(), 'src/data/social-stats.json'), 'utf8')));
  } catch {
    return null;
  }
}
