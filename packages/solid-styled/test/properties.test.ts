import * as csstree from 'css-tree';
import fc from 'fast-check';
import { xxHash32 as referenceHash } from 'js-xxhash';
import * as lightningcss from 'lightningcss';
import MagicString from 'magic-string';
import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';
import type { Analysis } from '../compiler/core/analyze';
import type { Node } from '../compiler/core/ast';
import { Ctx } from '../compiler/core/context';
import preprocessCSS from '../compiler/core/preprocess-css';
import processCSSTemplate, {
  type DynamicTemplateResult,
} from '../compiler/core/process-css-template';
import processScopedSheet from '../compiler/core/process-scoped-sheet';
import xxHash32 from '../compiler/xxhash32';
import { cssTemplate } from './arbitraries';

// Set FC_RUNS and FC_SEED to search wider than the default run.
const RUNS = Number(process.env.FC_RUNS ?? 150);
const SEED = Number(process.env.FC_SEED ?? 20261108);

function createParams(max: number): fc.Parameters<unknown> {
  return { seed: SEED, numRuns: Math.max(1, Math.round((max * RUNS) / 150)) };
}

// The per-test timeout grows with FC_RUNS: about 40 ms per run, at least 5 s.
const TIMEOUT = Math.max(5000, RUNS * 40);

const SHEET = 'c-abc';
const NAMESPACE = 'ns';
const SCOPE_NAME = `s\\:${SHEET}`;

/** A compile context over `code`, with the defaults the compiler uses. */
function createCtx(code: string): Ctx {
  const analysis = { names: new Set<string>() } as Analysis;
  return new Ctx(new MagicString(code), code, analysis, { verbose: false }, NAMESPACE);
}

/** Parses a template body into the template literal node the compiler reads. */
function parseTemplate(source: string): { code: string; node: Node } {
  const code = `x = \`${source}\`;`;
  const { program, errors } = parseSync('t.js', code);
  expect(errors).toEqual([]);
  const statement = program.body[0] as Node;
  return { code, node: statement.expression.right as Node };
}

/** Runs `processCSSTemplate` the way the compiler does. */
function processTemplate(source: string, isScoped: boolean): DynamicTemplateResult {
  const { code, node } = parseTemplate(source);
  return processCSSTemplate(createCtx(code), SHEET, node, isScoped);
}

function parseSheet(sheet: string): csstree.CssNode {
  const errors: string[] = [];
  const ast = csstree.parse(sheet, {
    onParseError(error) {
      errors.push(error.message);
    },
  });
  expect(errors).toEqual([]);
  return ast;
}

function isScopeAttribute(node: csstree.CssNode): boolean {
  return node.type === 'AttributeSelector' && node.name.name === SCOPE_NAME;
}

/** Splits a selector into compound selectors at combinators. */
function splitCompounds(selector: csstree.Selector): csstree.CssNode[][] {
  const compounds: csstree.CssNode[][] = [];
  let current: csstree.CssNode[] = [];
  for (const child of selector.children) {
    if (child.type === 'Combinator' || child.type === 'WhiteSpace') {
      if (current.length > 0) {
        compounds.push(current);
      }
      current = [];
    } else {
      current.push(child);
    }
  }
  if (current.length > 0) {
    compounds.push(current);
  }
  return compounds;
}

function isGlobalCompound(compound: csstree.CssNode[]): boolean {
  return (
    compound.length === 1 &&
    compound[0].type === 'PseudoClassSelector' &&
    compound[0].name === 'global'
  );
}

/**
 * Visits each top-level selector outside `@keyframes`. Selectors inside a
 * pseudo class such as `:not(.off)` are skipped. The compiler scopes those too.
 */
function visitSelectors(
  ast: csstree.CssNode,
  visit: (selector: csstree.Selector, inGlobal: boolean) => void,
): void {
  let inGlobal = 0;
  let inKeyframes = 0;
  let inPseudo = 0;
  csstree.walk(ast, {
    enter(node) {
      if (node.type === 'Atrule' && node.name === 'global' && node.block) {
        inGlobal += 1;
      }
      if (node.type === 'Atrule' && node.name === 'keyframes') {
        inKeyframes += 1;
      }
      if (node.type === 'PseudoClassSelector') {
        inPseudo += 1;
      }
      if (node.type === 'Selector' && inKeyframes === 0 && inPseudo === 0) {
        visit(node, inGlobal > 0);
      }
    },
    leave(node) {
      if (node.type === 'PseudoClassSelector') {
        inPseudo -= 1;
      }
      if (node.type === 'Atrule' && node.name === 'global' && node.block) {
        inGlobal -= 1;
      }
      if (node.type === 'Atrule' && node.name === 'keyframes') {
        inKeyframes -= 1;
      }
    },
  });
}

/**
 * Lists, in document order, how many scope attributes each compound selector
 * of the input should get: none inside `@global` and for a `:global(...)`
 * compound, one otherwise.
 */
function listExpectedCounts(ast: csstree.CssNode): number[] {
  const expected: number[] = [];
  visitSelectors(ast, (selector, inGlobal) => {
    for (const compound of splitCompounds(selector)) {
      expected.push(inGlobal || isGlobalCompound(compound) ? 0 : 1);
    }
  });
  return expected;
}

/** Counts the scope attributes of each compound selector of the output. */
function listActualCounts(ast: csstree.CssNode): number[] {
  const counts: number[] = [];
  visitSelectors(ast, (selector) => {
    for (const compound of splitCompounds(selector)) {
      let count = 0;
      for (const child of compound) {
        if (isScopeAttribute(child)) {
          count += 1;
        }
      }
      counts.push(count);
    }
  });
  return counts;
}

/**
 * Lists the selectors as text with the scope attribute removed and
 * `:global(...)` unwrapped, so input and output can be compared.
 */
function listBareSelectors(ast: csstree.CssNode): string[] {
  const selectors: string[] = [];
  visitSelectors(ast, (selector) => {
    // Drop the attribute everywhere, also inside `:not(...)`.
    const copy = csstree.clone(selector) as csstree.Selector;
    csstree.walk(copy, (node, item, list) => {
      if (isScopeAttribute(node) && list) {
        list.remove(item);
      }
    });
    let text = '';
    for (const child of copy.children) {
      if (child.type === 'PseudoClassSelector' && child.name === 'global' && child.children) {
        for (const inner of child.children) {
          text += csstree.generate(inner);
        }
      } else {
        text += csstree.generate(child);
      }
    }
    selectors.push(text);
  });
  return selectors;
}

function listKeyframesNames(ast: csstree.CssNode): string[] {
  const names: string[] = [];
  csstree.walk(ast, {
    enter(node) {
      if (node.type === 'Atrule' && node.name === 'keyframes' && node.prelude) {
        names.push(csstree.generate(node.prelude));
      }
    },
  });
  return names;
}

/** Lists the identifiers in `animation` and `animation-name` values. */
function listAnimationNames(ast: csstree.CssNode): string[] {
  const names: string[] = [];
  csstree.walk(ast, {
    enter(node) {
      if (
        node.type === 'Declaration' &&
        (node.property === 'animation' || node.property === 'animation-name') &&
        node.value.type === 'Value'
      ) {
        for (const item of node.value.children) {
          if (item.type === 'Identifier') {
            names.push(item.name);
          }
        }
      }
    },
  });
  return names;
}

/** True when an `:is(...)` holds a `:global(...)`. */
function hasGlobalInIs(ast: csstree.CssNode): boolean {
  let found = false;
  csstree.walk(ast, (node) => {
    if (node.type === 'PseudoClassSelector' && node.name === 'is') {
      csstree.walk(node, (inner) => {
        if (inner.type === 'PseudoClassSelector' && inner.name === 'global') {
          found = true;
        }
      });
    }
  });
  return found;
}

/** True when an `@global` block holds a nesting selector `&`. */
function hasNestingInGlobal(ast: csstree.CssNode): boolean {
  let found = false;
  csstree.walk(ast, (node) => {
    if (node.type === 'Atrule' && node.name === 'global' && node.block) {
      csstree.walk(node.block, (inner) => {
        if (inner.type === 'NestingSelector') {
          found = true;
        }
      });
    }
  });
  return found;
}

/** Lists the property of each `${}` in the source: the last `name:` before it. */
function listInterpolationProperties(source: string): string[] {
  const properties: string[] = [];
  let from = 0;
  for (;;) {
    const at = source.indexOf('${', from);
    if (at === -1) {
      return properties;
    }
    let name = '';
    for (const match of source.slice(0, at).matchAll(/([a-z-]+)\s*:/g)) {
      name = match[1];
    }
    properties.push(name);
    from = at + 2;
  }
}

describe('sheet scoping', () => {
  it(
    'gives each scoped compound selector the scope attribute once and leaves global ones alone',
    () => {
      fc.assert(
        fc.property(cssTemplate({ keyframes: false }), ({ sample }) => {
          const input = preprocessCSS(createCtx(sample), sample);
          const inputAst = parseSheet(input);

          // LightningCSS wraps a list that holds `:global(...)` in `:is(...)`. See the
          // `it.fails` below.
          fc.pre(!hasGlobalInIs(inputAst));
          // Nested rules in `@global` keep their `&`. The compiler drops it. See below.
          fc.pre(!hasNestingInGlobal(inputAst));
          const outputAst = parseSheet(processScopedSheet(SHEET, input));

          // Scoped compounds carry the attribute once, global ones never.
          expect(listActualCounts(outputAst)).toEqual(listExpectedCounts(inputAst));

          // Apart from the attribute and the `:global` wrapper, selectors keep their text.
          expect(listBareSelectors(outputAst)).toEqual(listBareSelectors(inputAst));
        }),
        createParams(150),
      );
    },
    TIMEOUT,
  );

  // Bug: LightningCSS rewrites `.a, :global(.b)` as `:is(.a, :global(.b))`. The
  // compiler then puts the scope attribute on the `:is(...)` as a whole, so the
  // global `.b` only matches an element that also has the attribute.
  it.fails('leaves a :global selector in a selector list alone', () => {
    const { sheet } = processTemplate('.a, :global(.b) { color: red; }', true);
    expect(sheet).not.toContain(`[${SCOPE_NAME}]:is(`);
  });

  // Bug: inside `@global`, LightningCSS leaves nested rules alone and the compiler
  // drops the `&`. `&.on` becomes `.on`, which now matches a descendant.
  it.fails('keeps the & of a nested rule inside @global', () => {
    const { sheet } = processTemplate('@global { .a { color: red; &.on { color: blue; } } }', true);
    expect(sheet).toContain('&.on');
  });

  it('scopes the selectors inside :not(...)', () => {
    const { sheet } = processTemplate('a:not(.off) { color: red; }', true);
    expect(sheet).toBe(`a[${SCOPE_NAME}]:not(.off[${SCOPE_NAME}]){color:red}`);
  });

  it(
    'produces CSS that LightningCSS and css-tree parse, and does so deterministically',
    () => {
      fc.assert(
        fc.property(cssTemplate(), fc.boolean(), ({ source }, isScoped) => {
          const first = processTemplate(source, isScoped);
          expect(processTemplate(source, isScoped)).toEqual(first);

          // Neither parser may throw or report an error.
          lightningcss.transform({
            code: new TextEncoder().encode(first.sheet),
            filename: 'out.css',
          });
          parseSheet(first.sheet);
        }),
        createParams(150),
      );
    },
    TIMEOUT,
  );
});

describe('interpolation', () => {
  it(
    'maps every interpolation to one var() in template order and keeps the unit after it',
    () => {
      fc.assert(
        fc.property(cssTemplate(), ({ source, vars }) => {
          const { sheet: spaced, variables } = processTemplate(source, false);
          const sheet = spaced.replaceAll(' ', '');
          expect(variables.length).toBe(vars.length);

          // Every variable the sheet names is one of the declared ids.
          const ids = new Set<string>();
          for (const [index] of vars.entries()) {
            ids.add(`--s-v-${NAMESPACE}-${index}`);
          }
          for (const match of sheet.matchAll(/--s-v-[\w-]*/g)) {
            expect(ids.has(match[0])).toBe(true);
          }

          // A declaration that holds the N-th variable has the property the N-th
          // `${}` was written in.
          const properties = listInterpolationProperties(source);
          csstree.walk(parseSheet(spaced), (node) => {
            if (node.type !== 'Declaration') {
              return;
            }
            const text = csstree.generate(node.value);
            for (const match of text.matchAll(/var\(--s-v-[\w-]*-(\d+)\)/g)) {
              expect(node.property).toBe(properties[Number(match[1])]);
            }
          });

          // The unit that follows each interpolation, in source order.
          const units: string[] = [];
          for (const match of source.matchAll(/\$\{[^}]*\}([a-z%]*)/g)) {
            units.push(match[1]);
          }

          for (const [index, expression] of vars.entries()) {
            const id = `--s-v-${NAMESPACE}-${index}`;
            expect(variables[index]).toBe(`${JSON.stringify(id)}: ${expression}`);

            // LightningCSS may merge, reorder or copy rules, and drops a declaration
            // that a later one overrides. So the sheet order is not checked, and a
            // variable may be absent from the sheet.
            if (!sheet.includes(`(${id})`)) {
              continue;
            }

            // A unit turns `var()` into `calc(var() * 1<unit>)`.
            const unit = units[index];
            if (unit) {
              expect(sheet).toContain(`calc(var(${id})*1${unit})`);
            } else {
              expect(sheet).not.toContain(`calc(var(${id})`);
            }
          }
        }),
        createParams(150),
      );
    },
    TIMEOUT,
  );
});

describe('keyframes', () => {
  it(
    'namespaces every keyframes name and renames each reference alike',
    () => {
      fc.assert(
        fc.property(cssTemplate({ global: false, media: false }), ({ sample }) => {
          // A fixed rule with an undeclared name and keywords: none is renamed.
          const withOther = `${sample}\n.u { animation: other 1s ease-in infinite }`;
          const input = preprocessCSS(createCtx(withOther), withOther);
          const inputAst = parseSheet(input);
          const outputAst = parseSheet(processScopedSheet(SHEET, input));

          const names = listKeyframesNames(inputAst);
          const wanted: string[] = [];
          for (const name of names) {
            wanted.push(`${SHEET}-${name}`);
          }
          expect(listKeyframesNames(outputAst)).toEqual(wanted);

          // Each reference to a keyframes rule gets the namespaced name.
          const before = listAnimationNames(inputAst);
          const after = listAnimationNames(outputAst);
          expect(after.length).toBe(before.length);
          for (const [index, name] of before.entries()) {
            expect(after[index]).toBe(names.includes(name) ? `${SHEET}-${name}` : name);
          }
          expect(after).toContain('other');
        }),
        createParams(150),
      );
    },
    TIMEOUT,
  );
});

describe('xxHash32', () => {
  // The compiler hashes the file id with seed 0 and writes it as lowercase hex.
  it(
    'matches js-xxhash for strings, including empty and non-ASCII ones',
    () => {
      const text = fc.oneof(
        fc.string({ unit: 'grapheme', maxLength: 80 }),
        fc.string({ unit: 'binary', maxLength: 80 }).map((value) => value.toWellFormed()),
        fc.constant(''),
      );
      fc.assert(
        fc.property(text, (value) => {
          expect(xxHash32(value)).toBe(referenceHash(value));
          expect(xxHash32(value).toString(16)).toBe(referenceHash(value).toString(16));
        }),
        createParams(300),
      );
    },
    TIMEOUT,
  );

  // The contract is well-formed strings. The compiler hashes only `id.split('?')[0]`,
  // a bundler path that is well-formed in practice, and the hash only has to be
  // deterministic. `toUtf8` treats any surrogate as the start of a pair and swallows
  // the next code unit, so a lone one differs from js-xxhash. This is intended.

  it(
    'matches js-xxhash for bytes and for any 32-bit seed',
    () => {
      fc.assert(
        fc.property(
          fc.uint8Array({ maxLength: 80 }),
          fc.integer({ min: 0, max: 0xffffffff }),
          (bytes, seed) => {
            expect(xxHash32(bytes, seed)).toBe(referenceHash(bytes, seed));
          },
        ),
        createParams(300),
      );
    },
    TIMEOUT,
  );
});
