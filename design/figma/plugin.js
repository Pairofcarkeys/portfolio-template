// Portfolio template → Figma. Builds an editable copy of the site in the open file:
// colour variables, text styles, a 12-column grid, components, and the Home and Work
// pages at desktop (1440) and phone (390) widths, plus full-page reference shots.
// CONTENT and RENDERS are prepended by design/build-figma.mjs.

const EDGE = 36;
const PHONE_EDGE = 16;
const GUTTER = 23;

const hexToRgb = hex => {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? value.split('').map(c => c + c).join('') : value;
  return { r: parseInt(full.slice(0, 2), 16) / 255, g: parseInt(full.slice(2, 4), 16) / 255, b: parseInt(full.slice(4, 6), 16) / 255 };
};

// ─── Fonts ──────────────────────────────────────────────────────────────────
// The site uses Inter Tight and IBM Plex Mono (both on Google Fonts, so in Figma).
// If a file can't load them, fall back to fonts every Figma install has.
const FONT_CANDIDATES = {
  sans: { Regular: [['Inter Tight', 'Regular'], ['Inter', 'Regular']], Medium: [['Inter Tight', 'Medium'], ['Inter', 'Medium']], SemiBold: [['Inter Tight', 'SemiBold'], ['Inter', 'Semi Bold'], ['Inter', 'SemiBold'], ['Inter', 'Bold']] },
  mono: { Regular: [['IBM Plex Mono', 'Regular'], ['Roboto Mono', 'Regular'], ['Inter', 'Regular']], Medium: [['IBM Plex Mono', 'Medium'], ['Roboto Mono', 'Medium'], ['Inter', 'Medium']] },
};
const FONTS = { sans: {}, mono: {} };
const fallbacks = [];
async function loadFonts() {
  for (const family of Object.keys(FONT_CANDIDATES)) {
    for (const weight of Object.keys(FONT_CANDIDATES[family])) {
      for (const [name, style] of FONT_CANDIDATES[family][weight]) {
        try {
          await figma.loadFontAsync({ family: name, style });
          FONTS[family][weight] = { family: name, style };
          if (name !== FONT_CANDIDATES[family][weight][0][0]) fallbacks.push(`${FONT_CANDIDATES[family][weight][0][0]} ${weight} → ${name}`);
          break;
        } catch (error) { /* try the next candidate */ }
      }
      if (!FONTS[family][weight]) throw new Error(`No font available for ${family} ${weight}`);
    }
  }
}

// ─── Variables, styles ──────────────────────────────────────────────────────
const VARS = {};
function createColorVariables() {
  const collection = figma.variables.createVariableCollection('Portfolio colours');
  const mode = collection.modes[0].modeId;
  collection.renameMode(mode, 'Light');
  for (const [name, hex] of Object.entries(CONTENT.colors)) {
    const variable = figma.variables.createVariable(name, collection, 'COLOR');
    variable.setValueForMode(mode, Object.assign(hexToRgb(hex), { a: 1 }));
    variable.scopes = ['ALL_SCOPES'];
    VARS[name] = variable;
  }
}
/** A solid paint bound to a colour variable, so restyling the variable restyles the file. */
function paint(name, opacity) {
  const base = { type: 'SOLID', color: hexToRgb(CONTENT.colors[name] || name), opacity: opacity === undefined ? 1 : opacity };
  return VARS[name] ? figma.variables.setBoundVariableForPaint(base, 'color', VARS[name]) : base;
}

const TYPE = {
  'Display/XL': { font: ['sans', 'SemiBold'], size: 190, line: 86, track: -6 },
  'Display/L': { font: ['sans', 'SemiBold'], size: 110, line: 90, track: -5 },
  'Display/M': { font: ['sans', 'SemiBold'], size: 72, line: 90, track: -5 },
  'Number/XL': { font: ['sans', 'Medium'], size: 120, line: 100, track: -5 },
  'Heading/1': { font: ['sans', 'Medium'], size: 40, line: 100, track: -3.5 },
  'Heading/2': { font: ['sans', 'Medium'], size: 30, line: 105, track: -3 },
  'Heading/3': { font: ['sans', 'Medium'], size: 22, line: 115, track: -2 },
  'Body/Large': { font: ['sans', 'Regular'], size: 18, line: 145, track: -1 },
  'Body/Regular': { font: ['sans', 'Regular'], size: 16, line: 150, track: -0.5 },
  'Body/Medium': { font: ['sans', 'Medium'], size: 16, line: 130, track: -1 },
  'Label/Mono': { font: ['mono', 'Regular'], size: 11.5, line: 130, track: 2, upper: true },
  'Label/Mono small': { font: ['mono', 'Regular'], size: 10, line: 130, track: 2, upper: true },
};
const STYLES = {};
function createTextStyles() {
  for (const [name, spec] of Object.entries(TYPE)) {
    const style = figma.createTextStyle();
    style.name = name;
    style.fontName = FONTS[spec.font[0]][spec.font[1]];
    style.fontSize = spec.size;
    style.lineHeight = { unit: 'PERCENT', value: spec.line };
    style.letterSpacing = { unit: 'PERCENT', value: spec.track };
    if (spec.upper) style.textCase = 'UPPER';
    STYLES[name] = style;
  }
}
function gridStyle(name, count, offset, gutter) {
  const style = figma.createGridStyle();
  style.name = name;
  style.layoutGrids = [{ pattern: 'COLUMNS', alignment: 'STRETCH', count, gutterSize: gutter, offset, visible: true, color: { r: 0.54, g: 0.01, b: 0.01, a: 0.06 } }];
  return style;
}

// ─── Node helpers ───────────────────────────────────────────────────────────
function pads(value) {
  if (value === undefined) return [0, 0, 0, 0];
  if (typeof value === 'number') return [value, value, value, value];
  if (value.length === 2) return [value[0], value[1], value[0], value[1]];
  return value;
}
/** An auto-layout frame (or component). */
function box(name, options) {
  const o = options || {};
  const node = o.component ? figma.createComponent() : figma.createFrame();
  node.name = name;
  node.fills = o.fill ? [paint(o.fill)] : [];
  node.clipsContent = !!o.clip;
  node.layoutMode = o.dir || 'VERTICAL';
  node.itemSpacing = o.gap || 0;
  const [top, right, bottom, left] = pads(o.pad);
  node.paddingTop = top; node.paddingRight = right; node.paddingBottom = bottom; node.paddingLeft = left;
  if (o.align) node.counterAxisAlignItems = o.align;
  if (o.justify) node.primaryAxisAlignItems = o.justify;
  if (o.wrap) { node.layoutWrap = 'WRAP'; node.counterAxisSpacing = o.wrapGap || o.gap || 0; }
  // Size first: resizing an auto-layout frame resets its sizing modes.
  if (o.w || o.h) node.resize(o.w || node.width, o.h || node.height);
  node.layoutSizingHorizontal = o.w ? 'FIXED' : 'HUG';
  node.layoutSizingVertical = o.h ? 'FIXED' : 'HUG';
  if (o.radius) node.cornerRadius = o.radius;
  return node;
}
/** Hairline or rule on given sides: { top: 2, bottom: 1 }. */
function stroke(node, sides, color) {
  node.strokes = [paint(color || 'rule')];
  node.strokeAlign = 'INSIDE';
  node.strokeTopWeight = sides.top || 0;
  node.strokeRightWeight = sides.right || 0;
  node.strokeBottomWeight = sides.bottom || 0;
  node.strokeLeftWeight = sides.left || 0;
  return node;
}
async function text(characters, styleName, options) {
  const o = options || {};
  const node = figma.createText();
  const spec = TYPE[styleName];
  node.fontName = FONTS[spec.font[0]][spec.font[1]];
  node.characters = String(characters);
  await node.setTextStyleIdAsync(STYLES[styleName].id);
  node.fills = [paint(o.color || 'fg')];
  node.name = o.name || String(characters).slice(0, 40);
  if (o.align) node.textAlignHorizontal = o.align;
  return node;
}
/** Append to an auto-layout parent; `fill` stretches across the parent's free space. */
function add(parent, child, options) {
  const o = options || {};
  parent.appendChild(child);
  if (o.fillW) child.layoutSizingHorizontal = 'FILL';
  if (o.fillH) child.layoutSizingVertical = 'FILL';
  if (o.grow) child.layoutGrow = 1;
  return child;
}
function rect(name, w, h, color, radius) {
  const node = figma.createRectangle();
  node.name = name;
  node.resize(w, h);
  node.fills = [paint(color)];
  if (radius) node.cornerRadius = radius;
  return node;
}
async function image(name, base64, width, scaleMode) {
  const img = figma.createImage(figma.base64Decode(base64));
  const size = await img.getSizeAsync();
  const node = figma.createRectangle();
  node.name = name;
  node.resize(width, Math.round(width * size.height / size.width));
  node.fills = [{ type: 'IMAGE', imageHash: img.hash, scaleMode: scaleMode || 'FILL' }];
  return node;
}
function setText(instance, layer, characters) {
  const node = instance.findOne(n => n.type === 'TEXT' && n.name === layer);
  if (node) node.characters = String(characters);
}
const pad2 = n => String(n).padStart(2, '0');

// ─── Components ─────────────────────────────────────────────────────────────
const C = {};

async function variants(name, build, states, parent) {
  const made = [];
  for (const state of states) {
    const component = await build(state);
    component.name = `State=${state}`;
    parent.appendChild(component);
    made.push(component);
  }
  const set = figma.combineAsVariants(made, parent);
  set.name = name;
  set.layoutMode = 'HORIZONTAL';
  set.itemSpacing = 24;
  set.paddingTop = set.paddingBottom = set.paddingLeft = set.paddingRight = 24;
  set.layoutSizingHorizontal = 'HUG';
  set.layoutSizingVertical = 'HUG';
  return set;
}

async function buildComponents(page) {
  const board = box('Components', { gap: 64, pad: 80, fill: 'bg' });
  page.appendChild(board);
  const section = async title => {
    const group = add(board, box(title, { gap: 20 }));
    add(group, await text(title, 'Label/Mono', { color: 'muted' }));
    const row = add(group, box(`${title} — items`, { dir: 'HORIZONTAL', gap: 40, align: 'MIN', wrap: true }));
    return row;
  };

  // Buttons
  let row = await section('Buttons');
  C.button = await variants('Button', async state => {
    const primary = state === 'Primary';
    const button = box('Button', { component: true, dir: 'HORIZONTAL', gap: 16, pad: [12, 16], align: 'CENTER', justify: 'SPACE_BETWEEN', fill: primary ? 'fg' : undefined, h: 44 });
    if (!primary) stroke(button, { top: 1, right: 1, bottom: 1, left: 1 }, 'fg');
    add(button, await text('Explore my experience', 'Body/Medium', { name: 'Label', color: primary ? 'bg' : 'fg' }));
    add(button, await text(primary ? '↓' : '→', 'Body/Medium', { name: 'Icon', color: primary ? 'bg' : 'fg' }));
    return button;
  }, ['Primary', 'Secondary'], row);

  // Labels + badges
  row = await section('Labels');
  C.badge = box('Badge', { component: true, dir: 'HORIZONTAL', pad: [2, 5] });
  stroke(C.badge, { top: 1, right: 1, bottom: 1, left: 1 }, 'muted');
  add(C.badge, await text('Concept', 'Label/Mono small', { name: 'Label', color: 'muted' }));
  row.appendChild(C.badge);
  C.now = box('Now', { component: true, dir: 'HORIZONTAL', pad: [2, 5], fill: 'accent' });
  add(C.now, await text('Now', 'Label/Mono small', { name: 'Label', color: 'bg' }));
  row.appendChild(C.now);

  // Navigation item
  row = await section('Navigation');
  C.nav = await variants('Nav item', async state => {
    const item = box('Nav item', { component: true, dir: 'HORIZONTAL', gap: 5, align: 'MIN' });
    add(item, await text('00', 'Label/Mono small', { name: 'Number', color: state === 'Active' ? 'accent' : 'faint' }));
    const label = add(item, box('Label wrap', { pad: [0, 0, 3, 0] }));
    if (state === 'Active') stroke(label, { bottom: 2 }, 'accent');
    add(label, await text('Index', 'Body/Medium', { name: 'Label' }));
    return item;
  }, ['Default', 'Active'], row);

  // Section bar
  row = await section('Section bar');
  C.bar = box('Section bar', { component: true, dir: 'HORIZONTAL', gap: GUTTER, pad: [10, 0, 0, 0], w: 1368 });
  stroke(C.bar, { top: 1 }, 'rule');
  add(C.bar, await text('04', 'Label/Mono', { name: 'Number', color: 'accent' }));
  add(C.bar, await text('Activity', 'Label/Mono', { name: 'Title' }), { grow: true });
  add(C.bar, await text('Past 12 months', 'Label/Mono', { name: 'Meta', color: 'muted' }));
  row.appendChild(C.bar);

  // Stat
  row = await section('Stat');
  C.stat = box('Stat', { component: true, gap: 6, pad: [10, 12, 0, 0], w: 110 });
  stroke(C.stat, { right: 1 }, 'hairline');
  add(C.stat, await text('Experience', 'Label/Mono small', { name: 'Label', color: 'muted' }));
  add(C.stat, await text('3', 'Heading/1', { name: 'Value' }));
  row.appendChild(C.stat);

  // Contact row
  row = await section('Contact row');
  C.contact = box('Contact row', { component: true, dir: 'HORIZONTAL', gap: 10, pad: [12, 0], align: 'CENTER', w: 300 });
  stroke(C.contact, { bottom: 1 }, 'hairline');
  add(C.contact, rect('Icon', 14, 14, 'fg', 3));
  add(C.contact, await text('LinkedIn', 'Body/Medium', { name: 'Label' }), { grow: true });
  add(C.contact, await text('↗', 'Label/Mono', { name: 'Arrow', color: 'muted' }));
  row.appendChild(C.contact);

  // Timeline row
  row = await section('Timeline row');
  C.timeline = box('Timeline row', { component: true, dir: 'HORIZONTAL', gap: 0, pad: [13, 0], align: 'CENTER', w: 1368 });
  stroke(C.timeline, { bottom: 1 }, 'hairline');
  const cells = [['No', '01', 'Label/Mono', 'faint', 116], ['Date', '2024 — Now', 'Label/Mono', 'fg', 230], ['Organisation', 'Your Company', 'Heading/3', 'fg', 345], ['Role', 'Co-founder', 'Body/Regular', 'fg', 345], ['Location', 'City, Country', 'Label/Mono', 'muted', 230]];
  for (const [name, value, style, color, width] of cells) {
    const cell = add(C.timeline, box(name, { dir: 'HORIZONTAL', gap: 8, align: 'CENTER', w: width }));
    add(cell, await text(value, style, { name, color }));
    // Instances can't gain children, so the badge lives here, hidden until a row is current.
    if (name === 'Organisation') { const now = add(cell, C.now.createInstance()); now.name = 'Now'; now.visible = false; }
  }
  add(C.timeline, await text('Experience', 'Label/Mono small', { name: 'Type', color: 'muted', align: 'RIGHT' }), { grow: true });
  row.appendChild(C.timeline);

  // Index row (/work)
  row = await section('Index row');
  C.index = await variants('Index row', async state => {
    const active = state === 'Active';
    const item = box('Index row', { component: true, dir: 'HORIZONTAL', gap: 12, pad: [13, 10], align: 'CENTER', w: 280, fill: active ? 'fg' : undefined });
    if (active) stroke(item, { bottom: 2 }, 'accent'); else stroke(item, { top: 1 }, 'hairline');
    add(item, await text('01', 'Label/Mono small', { name: 'Number', color: active ? 'bg' : 'muted' }));
    add(item, await text('Studio site', 'Body/Medium', { name: 'Title', color: active ? 'bg' : 'fg' }), { grow: true });
    return item;
  }, ['Default', 'Active'], row);

  // Device toggle
  row = await section('Device toggle');
  C.toggle = await variants('Device toggle', async state => {
    const toggle = box('Device toggle', { component: true, dir: 'HORIZONTAL', fill: 'bg' });
    stroke(toggle, { top: 1, right: 1, bottom: 1, left: 1 }, 'hairline');
    for (const device of ['Laptop', 'Phone']) {
      const on = (state === 'Laptop') === (device === 'Laptop');
      const option = add(toggle, box(device, { dir: 'HORIZONTAL', gap: 6, pad: [9, 10], align: 'CENTER' }));
      if (on) stroke(option, { bottom: 2 }, 'accent');
      add(option, rect('Icon', device === 'Laptop' ? 14 : 8, device === 'Laptop' ? 9 : 13, on ? 'fg' : 'muted', 1.5));
      add(option, await text(device, 'Label/Mono small', { name: 'Label', color: on ? 'fg' : 'muted' }));
    }
    return toggle;
  }, ['Laptop', 'Phone'], row);

  // Header
  row = await section('Header');
  C.header = box('Header / Desktop', { component: true, dir: 'HORIZONTAL', gap: GUTTER, pad: [0, EDGE], align: 'CENTER', w: 1440, h: 64, fill: 'bg' });
  stroke(C.header, { bottom: 1 }, 'hairline');
  const brand = add(C.header, box('Brand', { dir: 'HORIZONTAL', gap: 10, align: 'CENTER', w: 320 }));
  add(brand, rect('Mark', 11, 11, 'accent'));
  add(brand, await text(`${CONTENT.profile.firstName} ${CONTENT.profile.lastName}`, 'Body/Medium', { name: 'Name' }));
  add(C.header, await text(`${CONTENT.profile.role}, ${CONTENT.profile.company}\n${CONTENT.profile.location}`, 'Label/Mono small', { name: 'Role', color: 'muted' }), { grow: true });
  const nav = add(C.header, box('Nav', { dir: 'HORIZONTAL', gap: 64, align: 'CENTER' }));
  for (const [i, label] of CONTENT.nav.entries()) {
    const item = add(nav, C.nav.defaultVariant.createInstance());
    item.name = label;
    setText(item, 'Number', pad2(i));
    setText(item, 'Label', label);
  }
  row.appendChild(C.header);

  C.headerMobile = box('Header / Mobile', { component: true, gap: 14, pad: [16, PHONE_EDGE, 0, PHONE_EDGE], w: 390, fill: 'bg' });
  stroke(C.headerMobile, { bottom: 1 }, 'hairline');
  const brandMobile = add(C.headerMobile, box('Brand', { dir: 'HORIZONTAL', gap: 10, align: 'CENTER' }));
  add(brandMobile, rect('Mark', 11, 11, 'accent'));
  add(brandMobile, await text(`${CONTENT.profile.firstName} ${CONTENT.profile.lastName}`, 'Heading/3', { name: 'Name' }));
  const navMobile = add(C.headerMobile, box('Nav', { dir: 'HORIZONTAL', justify: 'SPACE_BETWEEN', pad: [0, 0, 10, 0] }), { fillW: true });
  for (const label of CONTENT.nav) {
    const item = add(navMobile, C.nav.defaultVariant.createInstance());
    item.name = label;
    const number = item.findOne(n => n.name === 'Number');
    if (number) number.visible = false;
    setText(item, 'Label', label);
  }
  row.appendChild(C.headerMobile);

  // Footer
  row = await section('Footer');
  C.footer = box('Footer / Desktop', { component: true, dir: 'HORIZONTAL', gap: GUTTER, pad: [20, EDGE, 48, EDGE], w: 1440, fill: 'bg' });
  stroke(C.footer, { top: 2 }, 'rule');
  const columns = [['', `${CONTENT.profile.firstName} ${CONTENT.profile.lastName}`], ['Contact', CONTENT.profile.email], ['Pages', CONTENT.nav.join('   ')], ['Colophon', `© ${new Date().getFullYear()} ${CONTENT.profile.firstName} ${CONTENT.profile.lastName}`]];
  for (const [label, value] of columns) {
    const column = add(C.footer, box(label || 'Name', { gap: 8 }), { grow: true });
    if (label) add(column, await text(label, 'Label/Mono small', { name: 'Label', color: 'muted' }));
    add(column, await text(value, label ? 'Body/Regular' : 'Body/Medium', { name: 'Value' }));
  }
  row.appendChild(C.footer);

  C.footerMobile = box('Footer / Mobile', { component: true, gap: 22, pad: [20, PHONE_EDGE, 40, PHONE_EDGE], w: 390, fill: 'bg' });
  stroke(C.footerMobile, { top: 2 }, 'rule');
  for (const [label, value] of columns) {
    const column = add(C.footerMobile, box(label || 'Name', { gap: 6 }));
    if (label) add(column, await text(label, 'Label/Mono small', { name: 'Label', color: 'muted' }));
    add(column, await text(value, label ? 'Body/Regular' : 'Body/Medium', { name: 'Value' }));
  }
  row.appendChild(C.footerMobile);

  return board;
}

// ─── Shared page sections ───────────────────────────────────────────────────
function bar(number, title, meta) {
  const instance = C.bar.createInstance();
  setText(instance, 'Number', number);
  setText(instance, 'Title', title);
  setText(instance, 'Meta', meta);
  if (!number) instance.findOne(n => n.name === 'Number').visible = false;
  return instance;
}
function navActive(header, label) {
  const item = header.findOne(n => n.type === 'INSTANCE' && n.name === label);
  if (item) item.setProperties({ State: 'Active' });
}
function button(label, variant, icon) {
  const instance = C.button.defaultVariant.createInstance();
  instance.setProperties({ State: variant });
  setText(instance, 'Label', label);
  if (icon) setText(instance, 'Icon', icon);
  else instance.findOne(n => n.name === 'Icon').visible = false;
  return instance;
}
async function calendar(weeks, cell) {
  const grid = box('Contribution calendar', { dir: 'HORIZONTAL', gap: 3 });
  const levels = CONTENT.stats.levels.slice(-weeks * 7);
  const shades = ['surface', 'hairline', 'faint', 'muted', 'fg'];
  for (let w = 0; w < weeks; w++) {
    const column = add(grid, box(`Week ${w + 1}`, { gap: 3 }));
    for (let d = 0; d < 7; d++) add(column, rect(`Day ${d + 1}`, cell, cell, shades[levels[w * 7 + d] || 0]));
  }
  return grid;
}
async function player(width) {
  const card = box('Listening', { dir: 'HORIZONTAL', gap: 14, w: width });
  const cover = add(card, box('Cover', { w: 96, h: 96, fill: 'surface', align: 'CENTER', justify: 'CENTER' }));
  const disc = figma.createEllipse();
  disc.name = 'Disc';
  disc.resize(56, 56);
  disc.fills = [paint('accent')];
  add(cover, disc);
  const body = add(card, box('Body', { gap: 2 }), { grow: true });
  add(body, await text(CONTENT.listening.title, 'Body/Medium', { name: 'Title' }));
  add(body, await text(CONTENT.listening.artist, 'Body/Regular', { name: 'Artist', color: 'muted' }));
  const progress = add(body, box('Progress', { dir: 'HORIZONTAL', pad: [10, 0, 10, 0], align: 'CENTER' }), { fillW: true });
  add(progress, rect('Knob', 8, 8, 'accent'));
  add(progress, rect('Track', 10, 1, 'rule'), { grow: true });
  const controls = add(body, box('Controls', { dir: 'HORIZONTAL', gap: 26, align: 'CENTER' }), { fillW: true });
  add(controls, await text('⏮   ▶   ⏭', 'Body/Medium', { name: 'Transport' }), { grow: true });
  add(controls, await text('Listen ↗', 'Label/Mono small', { name: 'Listen' }));
  return card;
}

// ─── Pages ──────────────────────────────────────────────────────────────────
async function homeDesktop() {
  const page = box('Home — Desktop 1440', { fill: 'bg', w: 1440, clip: true });
  await page.setGridStyleIdAsync(STYLES.gridDesktop.id);
  add(page, C.header.createInstance());
  const body = add(page, box('Content', { gap: 48, pad: [24, EDGE, 96, EDGE] }), { fillW: true });

  const hero = add(body, box('Hero', { gap: 10 }), { fillW: true });
  add(hero, bar('', 'Portfolio', `${CONTENT.timeline.length} entries`), { fillW: true });
  add(hero, await text(`${CONTENT.profile.firstName} ${CONTENT.profile.lastName}`, 'Display/XL', { name: 'Name' }));

  const profile = add(body, box('Profile', { dir: 'HORIZONTAL', gap: GUTTER }), { fillW: true });
  stroke(profile, { top: 1 }, 'hairline');
  profile.paddingTop = 20;
  const photo = add(profile, box('Portrait', { gap: 10, w: 326 }));
  const frame = add(photo, box('Photo', { fill: 'surface', w: 326, h: 400, align: 'CENTER', justify: 'CENTER' }));
  add(frame, await text('Your photo', 'Heading/3', { color: 'muted' }));
  add(photo, await text('Fig. 1 — Portrait', 'Label/Mono small', { color: 'muted' }));

  const about = add(profile, box('About', { gap: 18 }), { grow: true });
  add(about, await text('(01) Profile', 'Label/Mono small', { color: 'muted' }));
  add(about, await text(`${CONTENT.profile.role} at ${CONTENT.profile.company}.`, 'Heading/1', { name: 'Headline' }), { fillW: true });
  add(about, await text(CONTENT.profile.bio, 'Body/Large', { name: 'Bio', color: 'muted' }), { fillW: true });
  const stats = add(about, box('Stats', { dir: 'HORIZONTAL', pad: [0, 0, 0, 0] }), { fillW: true });
  stroke(stats, { top: 1 }, 'rule');
  for (const category of CONTENT.categories) {
    const stat = add(stats, C.stat.createInstance(), { grow: true });
    setText(stat, 'Label', category.label);
    setText(stat, 'Value', category.count);
  }
  add(about, button('Explore my experience', 'Primary', '↓'), { fillW: true });

  const side = add(profile, box('Contact & listening', { gap: 28, w: 440 }));
  const contact = add(side, box('Contact', { gap: 0 }), { fillW: true });
  add(contact, await text('(02) Contact', 'Label/Mono small', { color: 'muted' }));
  for (const label of ['LinkedIn', 'X', 'Instagram', 'TikTok', CONTENT.profile.email]) {
    const row = add(contact, C.contact.createInstance(), { fillW: true });
    setText(row, 'Label', label);
    if (label === CONTENT.profile.email) setText(row, 'Arrow', '→');
  }
  const listening = add(side, box('Listening section', { gap: 12 }), { fillW: true });
  add(listening, await text('(03) Listening', 'Label/Mono small', { color: 'muted' }));
  add(listening, await player(440));

  const activity = add(body, box('Activity', { gap: 20 }), { fillW: true });
  add(activity, bar('04', 'Activity', 'Past 12 months'), { fillW: true });
  const numbers = add(activity, box('Numbers', { dir: 'HORIZONTAL', gap: GUTTER }), { fillW: true });
  for (const [label, value, color] of [['GitHub contributions ↗', CONTENT.stats.contributions, 'fg'], ['Views I’ve generated →', CONTENT.stats.views, 'accent']]) {
    const block = add(numbers, box(label, { gap: 8, pad: [10, 0, 0, 0] }), { grow: true });
    stroke(block, { top: 1 }, 'hairline');
    add(block, await text(label, 'Label/Mono small', { color: 'muted' }));
    add(block, await text(Number(value).toLocaleString('en-US'), 'Number/XL', { name: 'Count', color }));
  }
  add(activity, await calendar(53, 22));

  const index = add(body, box('Experience index', { gap: 22 }), { fillW: true });
  add(index, bar('05', 'My experience — Index', `${CONTENT.profile.sinceYear} — Now`), { fillW: true });
  const filters = add(index, box('Filters', { dir: 'HORIZONTAL', gap: 28, align: 'BASELINE' }));
  add(filters, await text(`All ${CONTENT.timeline.length}`, 'Heading/1', { name: 'All' }));
  for (const category of CONTENT.categories) add(filters, await text(`${category.label} ${category.count}`, 'Heading/1', { name: category.label, color: 'faint' }));
  const table = add(index, box('Table', {}), { fillW: true });
  const head = add(table, C.timeline.createInstance(), { fillW: true });
  head.name = 'Table head';
  stroke(head, { top: 2, bottom: 1 }, 'rule');
  for (const [layer, label] of [['No', 'No.'], ['Date', 'Date ↓'], ['Organisation', 'Organisation'], ['Role', 'Role'], ['Location', 'Location'], ['Type', 'Type']]) {
    setText(head, layer, label);
    const node = head.findOne(n => n.type === 'TEXT' && n.name === layer);
    await node.setTextStyleIdAsync(STYLES['Label/Mono small'].id);
  }
  for (const [i, entry] of CONTENT.timeline.entries()) {
    const row = add(table, C.timeline.createInstance(), { fillW: true });
    row.name = entry.title;
    setText(row, 'No', pad2(i + 1));
    setText(row, 'Date', entry.date);
    setText(row, 'Organisation', entry.title);
    setText(row, 'Role', entry.role);
    setText(row, 'Location', entry.location);
    setText(row, 'Type', entry.category);
    if (entry.current) row.findOne(n => n.name === 'Now').visible = true;
  }
  add(index, await text(`Showing ${CONTENT.timeline.length} of ${CONTENT.timeline.length} · Sorted by date, descending`, 'Label/Mono small', { color: 'muted' }));

  add(page, C.footer.createInstance(), { fillW: true });
  return page;
}

async function homeMobile() {
  const page = box('Home — Phone 390', { fill: 'bg', w: 390, clip: true });
  await page.setGridStyleIdAsync(STYLES.gridMobile.id);
  add(page, C.headerMobile.createInstance(), { fillW: true });
  const body = add(page, box('Content', { gap: 32, pad: [24, PHONE_EDGE, 64, PHONE_EDGE] }), { fillW: true });
  const hero = add(body, box('Hero', { gap: 12 }), { fillW: true });
  add(hero, bar('', 'Portfolio', `${CONTENT.timeline.length} entries`), { fillW: true });
  add(hero, await text(`${CONTENT.profile.firstName}\n${CONTENT.profile.lastName}`, 'Display/M', { name: 'Name' }));

  const profile = add(body, box('Profile', { dir: 'HORIZONTAL', gap: 12, align: 'MAX' }), { fillW: true });
  add(profile, box('Photo', { fill: 'surface', w: 173, h: 217 }));
  add(profile, await text(`${CONTENT.profile.role} at ${CONTENT.profile.company}.`, 'Heading/3', { name: 'Headline' }), { grow: true });
  add(body, await text(CONTENT.profile.bio, 'Body/Large', { name: 'Bio', color: 'muted' }), { fillW: true });
  const stats = add(body, box('Stats', { dir: 'HORIZONTAL' }), { fillW: true });
  stroke(stats, { top: 1 }, 'rule');
  for (const category of CONTENT.categories) {
    const stat = add(stats, C.stat.createInstance(), { grow: true });
    setText(stat, 'Label', category.label);
    setText(stat, 'Value', category.count);
  }
  add(body, button('Explore my experience', 'Primary', '↓'), { fillW: true });

  const contact = add(body, box('Contact', {}), { fillW: true });
  add(contact, await text('(02) Contact', 'Label/Mono small', { color: 'muted' }));
  for (const label of ['LinkedIn', 'X', 'Instagram', 'TikTok', CONTENT.profile.email]) {
    const row = add(contact, C.contact.createInstance(), { fillW: true });
    setText(row, 'Label', label);
  }
  const listening = add(body, box('Listening section', { gap: 12 }), { fillW: true });
  add(listening, await text('(03) Listening', 'Label/Mono small', { color: 'muted' }));
  add(listening, await player(358));

  const activity = add(body, box('Activity', { gap: 16 }), { fillW: true });
  add(activity, bar('04', 'Activity', 'Past 12 months'), { fillW: true });
  for (const [label, value, color] of [['GitHub contributions ↗', CONTENT.stats.contributions, 'fg'], ['Views I’ve generated →', CONTENT.stats.views, 'accent']]) {
    const block = add(activity, box(label, { gap: 8, pad: [10, 0, 0, 0] }), { fillW: true });
    stroke(block, { top: 1 }, 'hairline');
    add(block, await text(label, 'Label/Mono small', { color: 'muted' }));
    add(block, await text(Number(value).toLocaleString('en-US'), 'Display/M', { name: 'Count', color }));
  }
  add(activity, await calendar(22, 13));
  add(page, C.footerMobile.createInstance(), { fillW: true });
  return page;
}

async function workIndex(width) {
  const aside = box('Index', { w: width });
  const head = add(aside, box('Index head', { dir: 'HORIZONTAL', pad: [10, 0], align: 'CENTER' }), { fillW: true });
  stroke(head, { top: 2 }, 'rule');
  add(head, await text(`Index · ${CONTENT.work.sites.length}`, 'Label/Mono small'), { grow: true });
  add(head, await text('● Shuffling', 'Label/Mono small', { color: 'accent' }));
  let n = 0;
  for (const [g, group] of CONTENT.work.groups.entries()) {
    const block = add(aside, box(group.label, { pad: [12, 0, 8, 0] }), { fillW: true });
    stroke(block, { top: 1 }, 'rule');
    add(block, await text(`${String.fromCharCode(65 + g)}   ${group.label}`, 'Label/Mono small', { name: 'Group' }));
    for (const site of CONTENT.work.sites.filter(s => s.group === group.id)) {
      n += 1;
      const row = add(block, C.index.defaultVariant.createInstance(), { fillW: true });
      row.name = site.title;
      if (n === 1) row.setProperties({ State: 'Active' });
      setText(row, 'Number', pad2(n));
      setText(row, 'Title', site.title);
    }
  }
  return aside;
}
async function workCaption(phone) {
  const site = CONTENT.work.sites[0];
  const group = CONTENT.work.groups.find(g => g.id === site.group);
  const caption = box('Caption', { dir: phone ? 'VERTICAL' : 'HORIZONTAL', gap: phone ? 14 : GUTTER, pad: [14, 0, 16, 0], align: phone ? 'MIN' : 'MAX' });
  stroke(caption, { top: 1, bottom: 1 }, 'hairline');
  const now = add(caption, box('Now', { dir: 'HORIZONTAL', gap: 16, align: 'MAX' }), phone ? { fillW: true } : { grow: true });
  const counter = add(now, box('Counter', { dir: 'HORIZONTAL', gap: 6, align: 'BASELINE' }));
  add(counter, await text('01', 'Display/M', { name: 'Index', color: 'accent' }));
  add(counter, await text(`/ ${CONTENT.work.sites.length}`, 'Label/Mono small', { color: 'muted' }));
  const title = add(now, box('Title', { gap: 4 }));
  add(title, await text(site.title, 'Heading/2', { name: 'Site' }));
  const meta = add(title, box('Meta', { dir: 'HORIZONTAL', gap: 8, align: 'CENTER' }));
  add(meta, await text(group.label, 'Label/Mono small', { color: 'muted' }));
  if (site.concept) meta.appendChild(C.badge.createInstance());
  const actions = add(caption, box('Actions', { dir: phone ? 'VERTICAL' : 'HORIZONTAL', gap: phone ? 8 : 12 }), phone ? { fillW: true } : {});
  const steps = add(actions, box('Prev / next', { dir: 'HORIZONTAL' }), phone ? { fillW: true } : {});
  add(steps, button('← Prev', 'Secondary', ''), phone ? { grow: true } : {});
  add(steps, button('Next →', 'Secondary', ''), phone ? { grow: true } : {});
  add(actions, button('Open live site', 'Primary', '↗'), phone ? { fillW: true } : {});
  return caption;
}

async function workDesktop() {
  const page = box('Work — Desktop 1440', { fill: 'bg', w: 1440, clip: true });
  await page.setGridStyleIdAsync(STYLES.gridDesktop.id);
  const header = add(page, C.header.createInstance());
  navActive(header, 'Work');
  const body = add(page, box('Content', { gap: 28, pad: [24, EDGE, 96, EDGE] }), { fillW: true });
  add(body, bar('', 'Work — Websites, designed & built', `${CONTENT.work.groups.length} projects · ${CONTENT.work.sites.length} sites`), { fillW: true });
  const intro = add(body, box('Intro', { dir: 'HORIZONTAL', gap: GUTTER, align: 'MAX', pad: [0, 0, 20, 0] }), { fillW: true });
  stroke(intro, { bottom: 2 }, 'rule');
  add(intro, await text('Design work', 'Display/L'), { grow: true });
  const blurb = add(intro, await text(`${CONTENT.work.sites.length} sites I have designed and built. Every one is live: click around inside the laptop or phone, or open it in its own tab.`, 'Body/Large', { name: 'Intro' }));
  blurb.resize(440, blurb.height);
  blurb.textAutoResize = 'HEIGHT';

  const showcase = add(body, box('Showcase', { dir: 'HORIZONTAL', gap: GUTTER }), { fillW: true });
  const main = add(showcase, box('Stage + caption', {}), { grow: true });
  const stage = add(main, box('Stage', { h: 700, align: 'CENTER', justify: 'CENTER', fill: 'bg' }), { fillW: true });
  stage.clipsContent = true;
  add(stage, await image('Laptop render', RENDERS.laptop, 800, 'FIT'));
  const toggle = C.toggle.defaultVariant.createInstance();
  stage.appendChild(toggle);
  toggle.layoutPositioning = 'ABSOLUTE';
  toggle.x = stage.width - toggle.width;
  toggle.y = 14;
  add(main, await workCaption(false), { fillW: true });
  add(showcase, await workIndex(280));
  add(body, await text('Laptop: MacBook Pro M3 16-inch 2024 by jackbaeten, CC BY 4.0, rigged by William Laverty. Phone: Apple iPhone 15 Pro Max Black by polyman, CC BY 4.0. Not affiliated with Apple.', 'Label/Mono small', { name: 'Credit', color: 'muted' }));
  add(page, C.footer.createInstance(), { fillW: true });
  return page;
}

async function workMobile() {
  const page = box('Work — Phone 390', { fill: 'bg', w: 390, clip: true });
  await page.setGridStyleIdAsync(STYLES.gridMobile.id);
  const header = add(page, C.headerMobile.createInstance(), { fillW: true });
  navActive(header, 'Work');
  const body = add(page, box('Content', { gap: 24, pad: [24, PHONE_EDGE, 64, PHONE_EDGE] }), { fillW: true });
  add(body, bar('', 'Work', `${CONTENT.work.groups.length} projects · ${CONTENT.work.sites.length} sites`, 358), { fillW: true });
  add(body, await text('Design work', 'Display/M'));
  add(body, await text(`${CONTENT.work.sites.length} sites I have designed and built. Every one is live: tap the phone to open it.`, 'Body/Large', { name: 'Intro' }), { fillW: true });
  const stage = add(body, box('Stage', { h: 448, align: 'CENTER', justify: 'CENTER', fill: 'bg' }), { fillW: true });
  stroke(stage, { top: 2 }, 'rule');
  add(stage, await image('Phone render', RENDERS.phone, 196, 'FIT'));
  const toggle = C.toggle.defaultVariant.createInstance();
  toggle.setProperties({ State: 'Phone' });
  // Icons only at phone width, like the site.
  toggle.findAll(n => n.name === 'Label').forEach(n => { n.visible = false; });
  stage.appendChild(toggle);
  toggle.layoutPositioning = 'ABSOLUTE';
  toggle.x = stage.width - toggle.width;
  toggle.y = 12;
  add(body, await text('Tap the screen to open the live site ↗', 'Label/Mono small', { color: 'muted', align: 'CENTER' }), { fillW: true });
  add(body, await workCaption(true), { fillW: true });
  add(body, await workIndex(358), { fillW: true });
  add(page, C.footerMobile.createInstance(), { fillW: true });
  return page;
}

async function foundations(page) {
  const board = box('Foundations', { gap: 56, pad: 80, fill: 'bg' });
  page.appendChild(board);
  add(board, await text('Foundations', 'Display/L'));
  add(board, await text('Colours are variables (Portfolio colours); type is text styles; layout uses the Grid styles. Change them here and every page follows.', 'Body/Large', { color: 'muted' }));

  const swatches = add(board, box('Colours', { dir: 'HORIZONTAL', gap: 20, wrap: true, w: 1280 }));
  for (const [name, hex] of Object.entries(CONTENT.colors)) {
    const swatch = add(swatches, box(name, { gap: 8, w: 140 }));
    const chip = add(swatch, rect('Chip', 140, 96, name));
    chip.strokes = [paint('hairline')];
    chip.strokeWeight = 1;
    add(swatch, await text(name, 'Body/Medium'));
    add(swatch, await text(hex, 'Label/Mono small', { color: 'muted' }));
  }
  const type = add(board, box('Type', { gap: 22 }));
  for (const name of Object.keys(TYPE)) {
    const row = add(type, box(name, { dir: 'HORIZONTAL', gap: 32, align: 'BASELINE' }));
    const label = add(row, await text(name, 'Label/Mono small', { color: 'muted' }));
    label.resize(160, label.height);
    label.textAutoResize = 'HEIGHT';
    const spec = TYPE[name];
    add(row, await text(spec.size > 60 ? 'Aa Design' : 'The quick brown fox jumps over the lazy dog', name));
  }
}

async function references(page) {
  let x = 0;
  for (const [name, base64] of Object.entries(RENDERS.reference)) {
    const width = name.startsWith('desktop') ? 1440 : 390;
    const shot = await image(`Live site — ${name}`, base64, width, 'FILL');
    shot.x = x;
    shot.y = 60;
    shot.locked = true;
    page.appendChild(shot);
    const label = await text(`${name} (screenshot of the live site, for reference)`, 'Label/Mono');
    label.x = x;
    label.y = 20;
    page.appendChild(label);
    x += width + 120;
  }
}

async function main() {
  await loadFonts();
  createColorVariables();
  createTextStyles();
  STYLES.gridDesktop = gridStyle('Grid/Desktop 12 col', 12, EDGE, GUTTER);
  STYLES.gridMobile = gridStyle('Grid/Phone 4 col', 4, PHONE_EDGE, 12);

  const first = figma.root.children[0];
  const blank = first.children.length === 0;
  const pages = {};
  for (const name of ['Foundations', 'Components', 'Desktop', 'Phone', 'Reference']) {
    const page = blank && name === 'Foundations' ? first : figma.createPage();
    page.name = name;
    pages[name] = page;
  }
  await foundations(pages.Foundations);
  await buildComponents(pages.Components);

  const desktop = [await homeDesktop(), await workDesktop()];
  desktop.forEach((frame, i) => { frame.x = i * 1600; pages.Desktop.appendChild(frame); });
  const phone = [await homeMobile(), await workMobile()];
  phone.forEach((frame, i) => { frame.x = i * 520; pages.Phone.appendChild(frame); });
  await references(pages.Reference);

  await figma.setCurrentPageAsync(pages.Desktop);
  figma.viewport.scrollAndZoomIntoView(desktop);
  figma.closePlugin(fallbacks.length ? `Portfolio built. Font fallbacks: ${fallbacks.join(', ')}` : 'Portfolio built: Foundations, Components, Desktop, Phone, Reference.');
}

main().catch(error => figma.closePlugin(`Couldn't build the portfolio: ${error.message}`));
