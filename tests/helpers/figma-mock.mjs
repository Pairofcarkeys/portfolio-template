// A strict stand-in for the Figma plugin API: just the calls design/figma uses, with
// the rules Figma enforces at runtime (fonts loaded before text edits, no children
// inside instances, FILL/HUG/ABSOLUTE only where auto-layout allows, dynamic-page access).
let ids = 0;
const nextId = () => `${++ids}:1`;

function imageSize(bytes) {
  const b = Buffer.from(bytes);
  if (b.readUInt32BE(0) === 0x89504e47) return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  for (let i = 2; i < b.length;) {
    const marker = b[i + 1];
    if (marker >= 0xc0 && marker <= 0xc3) return { width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5) };
    i += 2 + b.readUInt16BE(i + 2);
  }
  throw new Error('Image type is unsupported');
}

export function createFigmaMock({ fonts }) {
  const loaded = new Set();
  const key = font => `${font.family}/${font.style}`;
  const styles = new Map();
  const images = new Map();
  const result = { message: null, pages: [] };

  class Node {
    constructor(type) {
      this.id = nextId(); this.type = type; this.name = type; this.children = []; this.parent = null;
      this.visible = true; this.locked = false; this.x = 0; this.y = 0; this.width = 100; this.height = 100;
      this.fills = []; this.strokes = []; this._layoutMode = 'NONE';
    }
    get insideInstance() { for (let n = this; n; n = n.parent) if (n.type === 'INSTANCE') return true; return false; }
    appendChild(child) {
      if (!this.children) throw new Error(`${this.type} cannot have children`);
      if (this.insideInstance) throw new Error('Cannot move node. New parent is an instance or is inside of an instance');
      if (child.parent) child.parent.children.splice(child.parent.children.indexOf(child), 1);
      child.parent = this; this.children.push(child);
    }
    findAll(test) { const out = []; const walk = n => { for (const c of n.children || []) { if (test(c)) out.push(c); walk(c); } }; walk(this); return out; }
    findOne(test) { return this.findAll(test)[0] || null; }
    resize(w, h) {
      if (!(w > 0 && h > 0)) throw new Error(`Invalid size ${w}x${h}`);
      this.width = w; this.height = h;
      if (this._layoutMode !== 'NONE') { this._h = 'FIXED'; this._v = 'FIXED'; }
    }
    get layoutMode() { return this._layoutMode; }
    set layoutMode(value) { this._layoutMode = value; }
    set layoutWrap(value) { if (value === 'WRAP' && this._layoutMode !== 'HORIZONTAL') throw new Error('layoutWrap needs a horizontal auto-layout frame'); this._wrap = value; }
    get layoutWrap() { return this._wrap || 'NO_WRAP'; }
    set counterAxisAlignItems(value) {
      if (value === 'BASELINE' && this._layoutMode !== 'HORIZONTAL') throw new Error('BASELINE alignment needs horizontal auto-layout');
      if (!['MIN', 'MAX', 'CENTER', 'BASELINE'].includes(value)) throw new Error(`Bad counterAxisAlignItems ${value}`);
      this._counter = value;
    }
    set primaryAxisAlignItems(value) { if (!['MIN', 'MAX', 'CENTER', 'SPACE_BETWEEN'].includes(value)) throw new Error(`Bad primaryAxisAlignItems ${value}`); }
    sizing(axis, value) {
      const parentAuto = this.parent && this.parent._layoutMode && this.parent._layoutMode !== 'NONE';
      if (value === 'FILL' && !parentAuto) throw new Error(`FILL can only be set on children of auto-layout frames (${this.name})`);
      if (value === 'HUG' && this.type !== 'TEXT' && this._layoutMode === 'NONE' && this.type !== 'INSTANCE') throw new Error(`HUG can only be set on auto-layout frames and text (${this.name})`);
      this[axis] = value;
    }
    set layoutSizingHorizontal(v) { this.sizing('_h', v); }
    get layoutSizingHorizontal() { return this._h; }
    set layoutSizingVertical(v) { this.sizing('_v', v); }
    get layoutSizingVertical() { return this._v; }
    set layoutPositioning(v) {
      if (v === 'ABSOLUTE' && !(this.parent && this.parent._layoutMode !== 'NONE')) throw new Error('ABSOLUTE positioning needs an auto-layout parent');
      this._pos = v;
    }
    set layoutGrow(v) { this._grow = v; }
    async setGridStyleIdAsync(id) { if (!styles.has(id)) throw new Error(`No grid style ${id}`); this.gridStyleId = id; }
    set layoutGrids(v) { this._grids = v; }
  }

  class TextNode extends Node {
    constructor() { super('TEXT'); this.children = null; this._font = { family: 'Inter', style: 'Regular' }; this._chars = ''; this._h = 'HUG'; }
    set fontName(font) { if (!loaded.has(key(font))) throw new Error(`Font ${key(font)} is not loaded`); this._font = font; }
    get fontName() { return this._font; }
    set characters(value) {
      if (typeof value !== 'string') throw new Error('characters must be a string');
      if (!loaded.has(key(this._font))) throw new Error(`unloaded font "${key(this._font)}"`);
      this._chars = value;
    }
    get characters() { return this._chars; }
    set textStyleId(_) { throw new Error('Use setTextStyleIdAsync with documentAccess: dynamic-page'); }
    async setTextStyleIdAsync(id) {
      const style = styles.get(id);
      if (!style || style.type !== 'TEXT') throw new Error(`No text style ${id}`);
      if (!loaded.has(key(style.fontName))) throw new Error('Text style font not loaded');
      this._font = style.fontName; this.textStyleId_ = id;
    }
    set textAutoResize(v) { if (!['NONE', 'WIDTH_AND_HEIGHT', 'HEIGHT', 'TRUNCATE'].includes(v)) throw new Error(v); }
    set textAlignHorizontal(v) { if (!['LEFT', 'CENTER', 'RIGHT', 'JUSTIFIED'].includes(v)) throw new Error(v); }
  }

  class InstanceNode extends Node {
    setProperties(props) {
      const set = this.mainComponent.parent;
      if (!set || set.type !== 'COMPONENT_SET') throw new Error('Not a variant');
      const want = Object.entries(props).map(([k, v]) => `${k}=${v}`).join(', ');
      const target = set.children.find(c => c.name === want);
      if (!target) throw new Error(`No variant ${want} in ${set.name}`);
      const fresh = createInstanceOf(target);
      this.children = fresh.children; for (const c of this.children) c.parent = this;
      this.mainComponent = target;
    }
  }
  // An instance is a deep copy of its component; nested instances stay instances.
  function cloneNode(node, asInstance) {
    const copy = node.type === 'TEXT' ? new TextNode()
      : node.type === 'INSTANCE' || asInstance ? new InstanceNode('INSTANCE') : new Node(node.type);
    for (const [k, v] of Object.entries(node)) if (!['id', 'children', 'parent', 'type'].includes(k)) copy[k] = v;
    if (asInstance) copy.mainComponent = node;
    copy.children = node.children ? node.children.map(child => Object.assign(cloneNode(child, false), { parent: copy })) : null;
    return copy;
  }
  function createInstanceOf(component) {
    if (component.type !== 'COMPONENT') throw new Error('createInstance needs a component');
    return cloneNode(component, true);
  }
  class ComponentNode extends Node {
    constructor() { super('COMPONENT'); }
    createInstance() { return createInstanceOf(this); }
  }

  const page = name => { const p = new Node('PAGE'); p.name = name; return p; };
  const root = new Node('DOCUMENT');
  root.appendChild(page('Page 1'));
  let current = root.children[0];

  const collections = [];
  const figma = {
    root,
    get currentPage() { return current; },
    set currentPage(_) { throw new Error('Setting figma.currentPage is not supported with documentAccess: dynamic-page; use setCurrentPageAsync'); },
    async setCurrentPageAsync(p) { if (p.type !== 'PAGE') throw new Error('not a page'); current = p; },
    async loadFontAsync(font) { if (!fonts.some(f => f.family === font.family && f.style === font.style)) throw new Error(`The font "${key(font)}" could not be loaded`); loaded.add(key(font)); },
    createFrame: () => new Node('FRAME'),
    createComponent: () => new ComponentNode(),
    createRectangle: () => Object.assign(new Node('RECTANGLE'), { children: null }),
    createEllipse: () => Object.assign(new Node('ELLIPSE'), { children: null }),
    createText: () => new TextNode(),
    createPage: () => { const p = page('Page'); root.appendChild(p); return p; },
    combineAsVariants(nodes, parent) {
      if (!nodes.length || nodes.some(n => n.type !== 'COMPONENT')) throw new Error('combineAsVariants needs components');
      if (nodes.some(n => !/^\w+=.+/.test(n.name))) throw new Error('Variant names must be Property=Value');
      const set = new Node('COMPONENT_SET');
      parent.appendChild(set);
      for (const n of nodes) set.appendChild(n);
      Object.defineProperty(set, 'defaultVariant', { get: () => set.children[0] });
      return set;
    },
    createTextStyle() { const s = { id: `S:${nextId()}`, type: 'TEXT', name: '' }; styles.set(s.id, s); return s; },
    createGridStyle() { const s = { id: `S:${nextId()}`, type: 'GRID', name: '', layoutGrids: [] }; styles.set(s.id, s); return s; },
    createImage(bytes) {
      const size = imageSize(bytes);
      const hash = `img${images.size}`;
      images.set(hash, size);
      return { hash, getSizeAsync: async () => size };
    },
    base64Decode: value => new Uint8Array(Buffer.from(value, 'base64')),
    variables: {
      createVariableCollection(name) {
        const collection = { id: `VC:${nextId()}`, name, modes: [{ modeId: '1:0', name: 'Mode 1' }], renameMode(id, n) { this.modes.find(m => m.modeId === id).name = n; } };
        collections.push(collection);
        return collection;
      },
      createVariable(name, collection, type) {
        if (typeof collection !== 'object' || !collections.includes(collection)) throw new Error('createVariable expects a collection node');
        if (type !== 'COLOR') throw new Error(type);
        return { id: `V:${nextId()}`, name, values: {}, setValueForMode(mode, value) { if (!['r', 'g', 'b', 'a'].every(k => typeof value[k] === 'number')) throw new Error('bad colour'); this.values[mode] = value; } };
      },
      setBoundVariableForPaint(p, field, variable) {
        if (p.type !== 'SOLID' || field !== 'color' || !variable.id) throw new Error('bad bound paint');
        return { ...p, boundVariables: { color: { type: 'VARIABLE_ALIAS', id: variable.id } } };
      },
    },
    viewport: { scrollAndZoomIntoView(nodes) { if (nodes.some(n => { let p = n; while (p.parent && p.type !== 'PAGE') p = p.parent; return p !== current; })) throw new Error('Nodes are not on the current page'); } },
    closePlugin(message) { result.message = message; },
  };
  return { figma, result, root, styles, collections };
}
