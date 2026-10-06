import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = resolve(dirname(new URL(import.meta.url).pathname), '../../src');
// Exercise real local TS/TSX dependencies without a build or a Next server.
export function loadComponent(path, overrides = {}) {
  const filename = resolve(root, path);
  const code = ts.transpileModule(readFileSync(filename, 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  const localRequire = createRequire(filename);
  new Function('require', 'module', 'exports', code)(name => {
    if (name in overrides) return overrides[name];
    if (name.endsWith('.css')) return new Proxy({}, { get: (_, key) => String(key) });
    if (name.startsWith('@/') || name.startsWith('.')) {
      const target = name.startsWith('@/') ? resolve(root, name.slice(2)) : resolve(dirname(filename), name);
      for (const extension of ['.tsx', '.ts']) if (existsSync(target + extension)) return loadComponent(target + extension, overrides);
      return localRequire(target);
    }
    return localRequire(name);
  }, module, module.exports);
  return module.exports;
}
