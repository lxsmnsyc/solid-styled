// Counts the LightningCSS calls made by one `compile()` per fixture, and
// reports the sheets and source map it emits. LightningCSS is wrapped through
// its CommonJS exports before the compiler loads. `browserslist()` runs in the
// same expression as `browserslistToTargets()`, so its count is the same.
import type * as Lightning from 'lightningcss';
import { createRequire } from 'node:module';
import { FIXTURES, readFixture } from '../shared.ts';

interface LightningExports {
  transform: typeof Lightning.transform;
  browserslistToTargets: typeof Lightning.browserslistToTargets;
}

function isLightningExports(value: unknown): value is LightningExports {
  return (
    typeof value === 'object' &&
    value !== null &&
    'transform' in value &&
    typeof value.transform === 'function' &&
    'browserslistToTargets' in value &&
    typeof value.browserslistToTargets === 'function'
  );
}

const require = createRequire(new URL('../package.json', import.meta.url));
const counts = new Map<string, number>();

function count(name: string): void {
  counts.set(name, (counts.get(name) ?? 0) + 1);
}

// Wrap LightningCSS exports before its ESM wrapper reads them.
const lightningcss: unknown = require('lightningcss');
if (!isLightningExports(lightningcss)) {
  throw new TypeError('lightningcss no longer exports transform and browserslistToTargets');
}
const originalTransform = lightningcss.transform;
lightningcss.transform = function transform(options) {
  count('lightningcss.transform()');
  return originalTransform(options);
};
const originalTargets = lightningcss.browserslistToTargets;
lightningcss.browserslistToTargets = function browserslistToTargets(list) {
  count('browserslistToTargets()');
  return originalTargets(list);
};

const { compile } = await import('solid-styled/compiler');
const rows: Record<string, string | number | boolean>[] = [];
for (const name of FIXTURES) {
  counts.clear();
  const { id, code } = readFixture(name);
  const output = compile(id, code);
  rows.push({
    fixture: name,
    'browserslistToTargets()': counts.get('browserslistToTargets()') ?? 0,
    'lightningcss.transform()': counts.get('lightningcss.transform()') ?? 0,
    'sheets emitted': (output.code.match(/const css_\d+ = /g) ?? []).length,
    'map mappings (chars)': output.map.mappings.length,
    'code unchanged': output.code === code,
  });
}
console.table(rows);
