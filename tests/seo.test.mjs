import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadComponent } from './helpers/load-component.mjs';

const { SITE_URL, SITE_NAME } = loadComponent('lib/seo.ts');

test('every detail page has its own canonical URL, title, and description', async () => {
  const page = loadComponent('app/timeline/[id]/page.tsx');
  const urls = new Set();
  for (const { id } of page.generateStaticParams()) {
    const metadata = await page.generateMetadata({ params: Promise.resolve({ id }) });
    assert.equal(metadata.openGraph.url, `${SITE_URL}/timeline/${id}`);
    assert.equal(metadata.openGraph.description, metadata.description);
    assert.equal(metadata.twitter.title, metadata.openGraph.title);
    assert.ok(metadata.openGraph.images[0].url.startsWith(`${SITE_URL}/`));
    assert.ok(metadata.description.length > 30, id);
    urls.add(metadata.openGraph.url);
  }
  assert.equal(urls.size, page.generateStaticParams().length);
});

test('sitemap and robots use the configured site URL; /random is not indexed', () => {
  const { metadata } = loadComponent('app/random/page.tsx');
  const sitemap = loadComponent('app/sitemap.ts').default();
  const robots = loadComponent('app/robots.ts').default();
  assert.deepEqual(metadata.robots, { index: false, follow: true });
  assert.equal(metadata.alternates.canonical, '/random');
  assert.ok(sitemap.every(entry => entry.url.startsWith(SITE_URL)));
  assert.ok(sitemap.every(entry => !entry.url.endsWith('/random')));
  assert.equal(robots.sitemap, `${SITE_URL}/sitemap.xml`);
});

test('structured data describes the profile and safely serializes page text', () => {
  const { SiteStructuredData, ProfileStructuredData, StructuredData } = loadComponent('components/StructuredData.tsx');
  const parse = component => JSON.parse(renderToStaticMarkup(React.createElement(component)).match(/<script[^>]*>([\s\S]*)<\/script>/)[1]);
  const person = parse(SiteStructuredData)['@graph'].find(node => node['@type'] === 'Person');
  const profile = parse(ProfileStructuredData);
  assert.equal(person.name, SITE_NAME);
  assert.equal(profile.mainEntity['@id'], person['@id']);
  assert.equal(profile.url, `${SITE_URL}/about`);
  assert.ok(person.sameAs.length > 0);
  const unsafe = '</script><script>alert(1)</script>';
  const html = renderToStaticMarkup(React.createElement(StructuredData, { data: { name: unsafe } }));
  assert.equal((html.match(/<script/g) ?? []).length, 1);
  assert.equal(JSON.parse(html.match(/<script[^>]*>([\s\S]*)<\/script>/)[1]).name, unsafe);
});
