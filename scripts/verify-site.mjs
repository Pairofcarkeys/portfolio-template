import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

// Must match SITE_URL in src/lib/seo.ts.
const origin = readFileSync('src/lib/seo.ts', 'utf8').match(/SITE_URL = '([^']+)'/)[1];
const escaped = origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? htmlFiles(path) : path.endsWith('.html') ? [path] : [];
  });
}
const pages = htmlFiles('out').filter((path) => !path.endsWith('/404.html'));
for (const path of pages) {
  const route = relative('out', path).replace(/\.html$/, '').replace(/^index$/, '');
  const html = readFileSync(path, 'utf8');
  const expected = `${origin}/${route}`;
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
  assert.ok(canonical, `${path}: missing canonical ${expected}`);
  assert.equal(new URL(canonical[1]).href, new URL(expected).href, `${path}: incorrect canonical`);
  const openGraphUrl = html.match(/<meta property="og:url" content="([^"]+)"/);
  assert.ok(openGraphUrl, `${path}: missing Open Graph URL`);
  assert.equal(new URL(openGraphUrl[1]).href, new URL(expected).href, `${path}: incorrect Open Graph URL`);
  assert.match(html, new RegExp(`<meta property="og:image" content="${escaped}/`), `${path}: missing sharing image`);
  assert.match(html, /<meta name="twitter:card" content="summary"/, `${path}: missing Twitter card`);
  const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
  assert.ok(schemas.some(schema => schema['@graph']?.some(node => node['@type'] === 'Person')), `${path}: missing person identity`);
  if (route === 'about') assert.ok(schemas.some(schema => schema['@type'] === 'ProfilePage'), 'About: missing ProfilePage');
}
console.log(`Verified canonical URLs, sharing metadata, and structured identity for ${pages.length} exported pages.`);
const sitemap = readFileSync('out/sitemap.xml', 'utf8');
const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).href);
const indexablePages = pages.filter(path => !/<meta name="robots" content="[^"]*noindex/.test(readFileSync(path, 'utf8')));
const expectedLocations = indexablePages.map((path) => new URL(`${origin}/${relative('out', path).replace(/\.html$/, '').replace(/^index$/, '')}`).href);
assert.deepEqual(locations.sort(), expectedLocations.sort(), 'Sitemap must cover indexable exported pages exactly');
const robots = readFileSync('out/robots.txt', 'utf8');
assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`));
assert.ok(robots.includes('Allow: /'));
console.log('Verified sitemap coverage and robots.txt.');
