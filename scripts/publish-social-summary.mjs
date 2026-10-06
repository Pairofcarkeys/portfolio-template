import { readFile, mkdir, rename, writeFile } from 'node:fs/promises';
import { summarizeSocialStats } from '../src/lib/social-summary.mjs';
const source = new URL('../src/data/social-stats.json', import.meta.url);
let snapshot;
try { snapshot = JSON.parse(await readFile(source, 'utf8')); } catch (error) {
  if (error.code === 'ENOENT') { console.log('No social snapshot yet; counter remains unavailable.'); process.exit(0); }
  throw error;
}
const summary = summarizeSocialStats(snapshot);
if (!summary) throw new Error('Invalid social snapshot: refusing to publish summary.');
const destination = new URL('../public/social-summary.json', import.meta.url);
await mkdir(new URL('../public/', import.meta.url), { recursive:true });
const temporary = new URL(`../public/.social-summary-${process.pid}.tmp`, import.meta.url);
await writeFile(temporary, JSON.stringify(summary, null, 2) + '\n');
await rename(temporary, destination);
console.log(`Published observed social summary for ${summary.postCount} posts across ${summary.accountCount} accounts.`);
