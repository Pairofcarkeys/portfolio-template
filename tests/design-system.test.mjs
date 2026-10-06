import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const files = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
  entry.isDirectory() ? (entry.name === 'data' ? [] : files(`${dir}/${entry.name}`)) : /\.(css|tsx?)$/.test(entry.name) ? [`${dir}/${entry.name}`] : []);
const sources = files('src').map(path => [path, readFileSync(path, 'utf8')]);

/** White, black, a neutral grey, or the blood-red family (red channel only). */
function onPalette(r, g, b) {
  if (Math.max(r, g, b) - Math.min(r, g, b) <= 8) return true;
  return r > g + 20 && Math.abs(g - b) <= 8;
}

test('every colour is white, black, grey or blood red', () => {
  const css = readFileSync('src/app/globals.css', 'utf8');
  assert.match(css, /--accent: #8a0303;/);
  for (const [path, source] of sources) {
    for (const [hex] of source.matchAll(/#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b(?![\w-])/gi)) {
      const digits = hex.slice(1);
      const full = digits.length <= 4 ? [...digits.slice(0, 3)].map(c => c + c).join('') : digits.slice(0, 6);
      const [r, g, b] = [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16));
      assert.ok(onPalette(r, g, b), `${path}: ${hex} is off-palette`);
    }
    for (const [, r, g, b] of source.matchAll(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/g)) {
      assert.ok(onPalette(+r, +g, +b), `${path}: rgb(${r}, ${g}, ${b}) is off-palette`);
    }
    assert.doesNotMatch(source, /color:\s*(?:blue|green|orange|yellow|purple|pink|teal|cyan)\b/, path);
  }
});

test('type is Inter Tight with IBM Plex Mono for labels, and nothing else', () => {
  const layout = readFileSync('src/app/layout.tsx', 'utf8');
  assert.match(layout, /IBM_Plex_Mono/);
  assert.match(layout, /localFont\(\{ src: \[[^\]]*InterTight-400\.woff2/s);
  for (const [path, source] of sources) {
    assert.doesNotMatch(source, /@font-face|text-transform:\s*lowercase\s*!important/, path);
  }
  const fonts = readdirSync('public/fonts');
  assert.ok(fonts.every(name => /^InterTight-\d00\.woff2$/.test(name)), `unexpected font files: ${fonts}`);
});
