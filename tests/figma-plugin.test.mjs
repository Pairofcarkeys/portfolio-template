import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createFigmaMock } from './helpers/figma-mock.mjs';

const code = readFileSync(new URL('../design/figma/code.js', import.meta.url), 'utf8');
const manifest = JSON.parse(readFileSync(new URL('../design/figma/manifest.json', import.meta.url), 'utf8'));
const GOOGLE = [['Inter Tight', ['Regular', 'Medium', 'SemiBold']], ['IBM Plex Mono', ['Regular', 'Medium']], ['Inter', ['Regular', 'Medium', 'Semi Bold', 'Bold']]];
const fontsFrom = list => list.flatMap(([family, styles]) => styles.map(style => ({ family, style })));

async function run(fonts) {
  const mock = createFigmaMock({ fonts });
  await new Function('figma', `${code}\nreturn new Promise(resolve => setTimeout(resolve, 0));`)(mock.figma);
  // main() is async: wait until it closes the plugin.
  for (let i = 0; i < 200 && mock.result.message === null; i++) await new Promise(resolve => setTimeout(resolve, 5));
  return mock;
}

test('the Figma plugin manifest points at the generated bundle with dynamic page access', () => {
  assert.equal(manifest.main, 'code.js');
  assert.equal(manifest.documentAccess, 'dynamic-page');
  assert.deepEqual(manifest.editorType, ['figma']);
});

test('the Figma plugin builds every page from the template content', async () => {
  const { result, root, styles, collections } = await run(fontsFrom(GOOGLE));
  assert.match(result.message, /^Portfolio built/, result.message);
  assert.deepEqual(root.children.map(page => page.name), ['Foundations', 'Components', 'Desktop', 'Phone', 'Reference']);
  const [, components, desktop, phone, reference] = root.children;
  assert.deepEqual(desktop.children.map(frame => frame.name), ['Home — Desktop 1440', 'Work — Desktop 1440']);
  assert.deepEqual(phone.children.map(frame => frame.name), ['Home — Phone 390', 'Work — Phone 390']);
  assert.equal(reference.findAll(node => node.name.startsWith('Live site')).length, 6);
  const sets = components.findAll(node => node.type === 'COMPONENT_SET').map(node => node.name);
  for (const name of ['Button', 'Nav item', 'Index row', 'Device toggle']) assert.ok(sets.includes(name), name);
  // Colours are variables, type is text styles, layout has grid styles.
  assert.ok(collections[0] && collections[0].modes[0].name === 'Light');
  const kinds = [...styles.values()].map(style => style.type);
  assert.ok(kinds.filter(kind => kind === 'TEXT').length >= 10);
  assert.equal(kinds.filter(kind => kind === 'GRID').length, 2);
  // Real content, not lorem: every timeline row and every site appears.
  const texts = desktop.findAll(node => node.type === 'TEXT').map(node => node.characters);
  const data = JSON.parse(readFileSync(new URL('../src/data/design-work.json', import.meta.url), 'utf8'));
  for (const site of data.sites) assert.ok(texts.includes(site.title), site.title);
  assert.ok(desktop.findAll(node => node.name === 'Laptop render').length === 1);
  assert.ok(phone.findAll(node => node.name === 'Phone render').length === 1);
});

test('the Figma plugin falls back to Inter when the Google fonts are missing', async () => {
  const { result } = await run(fontsFrom([['Inter', ['Regular', 'Medium', 'Semi Bold', 'Bold']]]));
  assert.match(result.message, /^Portfolio built\. Font fallbacks: Inter Tight Regular → Inter/, result.message);
});
