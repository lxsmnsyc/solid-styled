import fc from 'fast-check';
import { parseSync } from 'oxc-parser';

/**
 * Shared fast-check generators for compiler tests.
 *
 * Every generator keeps its output small (a few rules, a few components) so
 * that shrinking stays fast and a failing counterexample is readable.
 */

export interface GeneratedCss {
  /** The body of a `css` template, with `${expr}` spans in place. */
  source: string;
  /** The interpolated expressions, in source order. */
  vars: string[];
  /** `source` with each `${expr}` (and its unit) replaced by a valid value of its kind. */
  sample: string;
}

export interface CssTemplateOptions {
  /** Allow `@global { }` and `:global(...)`. Default: true. */
  global?: boolean;
  /** Allow `@keyframes` with a rule that uses it. Default: true. */
  keyframes?: boolean;
  /** Allow `@media`. Default: true. */
  media?: boolean;
}

const NAMES = ['a', 'b', 'box', 'item', 'row', 'x1', 'my-class'];
const TYPES = ['div', 'span', 'h1', 'p', 'a', 'ul', 'li', 'button'];
const PSEUDO_CLASSES = [':hover', ':focus', ':first-child', ':not(.off)'];
const PSEUDO_ELEMENTS = ['::before', '::after'];
const COMBINATORS = [' ', ' > ', ' + ', ' ~ '];

/** Interpolation names. Each one is an expression over the `props` parameter. */
const PROP_NAMES = ['color', 'size', 'gap', 'ms', 'opacity'];

type ValueKind = 'color' | 'length' | 'number' | 'time';

/**
 * Units that may follow an interpolation, per value kind. The compiler
 * recognizes each of them. Kinds with no unit take a bare `${expr}`.
 */
export const UNITS: Record<ValueKind, string[]> = {
  color: [],
  length: ['px', 'em', 'rem', '%', 'vw', 'vh', 'ch', 'pt'],
  number: [],
  time: ['ms', 's'],
};

/** Fixed values, each valid for every property of its kind. */
const STATIC_VALUES: Record<ValueKind, string[]> = {
  color: ['red', 'blue', '#fff', '#112233', 'rgb(1, 2, 3)', 'transparent'],
  length: ['0', '1px', '2em', '50%', '10rem'],
  number: ['0', '1', '0.5'],
  time: ['1s', '200ms'],
};

/** What a bare `${expr}` of each kind stands for in `sample`. */
const SAMPLE_VALUES: Record<ValueKind, string> = {
  color: 'red',
  length: '1px',
  number: '1',
  time: '1s',
};

interface Property {
  name: string;
  kind: ValueKind;
  /** Maximum number of space-separated parts. */
  parts: number;
  /** True when `auto` is a valid value. */
  auto: boolean;
}

const PROPERTIES: Property[] = [
  { name: 'color', kind: 'color', parts: 1, auto: false },
  { name: 'background-color', kind: 'color', parts: 1, auto: false },
  { name: 'border-color', kind: 'color', parts: 1, auto: false },
  { name: 'width', kind: 'length', parts: 1, auto: true },
  { name: 'height', kind: 'length', parts: 1, auto: true },
  { name: 'top', kind: 'length', parts: 1, auto: true },
  { name: 'left', kind: 'length', parts: 1, auto: true },
  { name: 'font-size', kind: 'length', parts: 1, auto: false },
  { name: 'margin', kind: 'length', parts: 4, auto: true },
  { name: 'padding', kind: 'length', parts: 4, auto: false },
  { name: 'opacity', kind: 'number', parts: 1, auto: false },
  { name: 'flex-grow', kind: 'number', parts: 1, auto: false },
  { name: 'transition-duration', kind: 'time', parts: 1, auto: false },
  { name: 'animation-duration', kind: 'time', parts: 1, auto: false },
];

/** A piece of CSS text, its sample rendering, and its interpolations in order. */
interface Piece {
  text: string;
  sample: string;
  vars: string[];
}

function createPiece(text: string, sample = text, vars: string[] = []): Piece {
  return { text, sample, vars };
}

/** Joins pieces with a separator, keeping vars in order. */
function joinPieces(pieces: Piece[], separator: string): Piece {
  const text: string[] = [];
  const sample: string[] = [];
  const vars: string[] = [];
  for (const piece of pieces) {
    text.push(piece.text);
    sample.push(piece.sample);
    vars.push(...piece.vars);
  }
  return { text: text.join(separator), sample: sample.join(separator), vars };
}

/** Wraps a piece: `before + piece + after`, in both renderings. */
function wrapPiece(before: string, piece: Piece, after: string): Piece {
  return {
    text: `${before}${piece.text}${after}`,
    sample: `${before}${piece.sample}${after}`,
    vars: piece.vars,
  };
}

/** One value part: a fixed word, a bare `${props.x}`, or `${props.x}<unit>`. */
function makeValuePart(property: Property): fc.Arbitrary<Piece> {
  const words = property.auto
    ? [...STATIC_VALUES[property.kind], 'auto']
    : STATIC_VALUES[property.kind];
  const fixed = fc.constantFrom(...words).map((word) => createPiece(word));
  const expr = fc.constantFrom(...PROP_NAMES).map((name) => `props.${name}`);
  const bare = expr.map((e) => createPiece(`\${${e}}`, SAMPLE_VALUES[property.kind], [e]));
  const options = [fixed, fixed, bare];
  const units = UNITS[property.kind];
  if (units.length > 0) {
    // `${x}px`: the unit follows the interpolation with no space.
    options.push(
      fc
        .tuple(expr, fc.constantFrom(...units))
        .map(([e, unit]) => createPiece(`\${${e}}${unit}`, `1${unit}`, [e])),
    );
  }
  return fc.oneof(...options);
}

function makeDeclaration(): fc.Arbitrary<Piece> {
  return fc
    .constantFrom(...PROPERTIES)
    .chain((property) =>
      fc
        .array(makeValuePart(property), { minLength: 1, maxLength: property.parts })
        .map((parts) => wrapPiece(`${property.name}: `, joinPieces(parts, ' '), ';')),
    );
}

function makeDeclarations(max = 3): fc.Arbitrary<Piece> {
  return fc
    .array(makeDeclaration(), { minLength: 1, maxLength: max })
    .map((list) => joinPieces(list, ' '));
}

/** A compound selector: type, class, id, attribute or universal, plus pseudos. */
function makeCompound(allowPseudoElement: boolean): fc.Arbitrary<string> {
  const head = fc.oneof(
    fc.constantFrom(...TYPES),
    fc.constantFrom(...NAMES).map((name) => `.${name}`),
    fc.constantFrom(...NAMES).map((name) => `#${name}`),
    fc.constantFrom('[id]', '[data-x]', '[type="text"]', '[href^="/"]'),
    fc.constant('*'),
  );
  const tail = fc.oneof(
    fc.constant(''),
    fc.constant(''),
    fc.constantFrom(...NAMES).map((name) => `.${name}`),
    fc.constantFrom(...PSEUDO_CLASSES),
    allowPseudoElement ? fc.constantFrom(...PSEUDO_ELEMENTS) : fc.constant(''),
  );
  return fc.tuple(head, tail).map(([h, t]) => `${h}${t}`);
}

/** One compound, or `:global(.x)` as a whole compound when allowed. */
function makeSelectorPart(allowPseudoElement: boolean, global: boolean): fc.Arbitrary<string> {
  const compound = makeCompound(allowPseudoElement);
  if (!global) {
    return compound;
  }
  // `:global(.x)` skips the scope marker for that compound.
  const globalCompound = fc.constantFrom(...NAMES).map((name) => `:global(.${name})`);
  return fc.oneof(compound, compound, globalCompound);
}

function makeSelector(global: boolean, allowPseudoElement = true): fc.Arbitrary<string> {
  const prefix = fc.array(
    fc
      .tuple(makeSelectorPart(false, global), fc.constantFrom(...COMBINATORS))
      .map(([part, combinator]) => `${part}${combinator}`),
    { maxLength: 2 },
  );
  return fc
    .tuple(prefix, makeSelectorPart(allowPseudoElement, global))
    .map(([head, last]) => `${head.join('')}${last}`);
}

function makeSelectorList(global: boolean): fc.Arbitrary<string> {
  return fc
    .array(makeSelector(global), { minLength: 1, maxLength: 2 })
    .map((list) => list.join(', '));
}

/** A style rule, optionally with one nested rule (CSS nesting with `&`). */
function makeRule(global: boolean): fc.Arbitrary<Piece> {
  const plain = fc
    .tuple(makeSelectorList(global), makeDeclarations())
    .map(([selector, body]) => wrapPiece(`${selector} { `, body, ' }'));
  const nested = fc
    .tuple(
      // A pseudo element cannot be followed by a nested rule.
      makeSelector(global, false),
      makeDeclarations(2),
      fc.constantFrom('& ', '& > ', '&.on ', '& + '),
      makeSelector(global, false),
      makeDeclarations(2),
    )
    .map(([outer, outerBody, amp, inner, innerBody]) =>
      joinPieces(
        [
          wrapPiece(`${outer} { `, outerBody, ' '),
          wrapPiece(`${amp}${inner} { `, innerBody, ' } }'),
        ],
        '',
      ),
    );
  return fc.oneof(plain, plain, nested);
}

function makeRules(max: number, global: boolean): fc.Arbitrary<Piece> {
  return fc
    .array(makeRule(global), { minLength: 1, maxLength: max })
    .map((list) => joinPieces(list, '\n'));
}

/**
 * `@media` with a fixed query. An interpolation inside the query makes both
 * compilers throw "Invalid media query", so the query never has one.
 */
function makeMedia(global: boolean): fc.Arbitrary<Piece> {
  return fc
    .tuple(
      fc.constantFrom(
        '(min-width: 600px)',
        '(max-width: 40em)',
        'screen',
        '(prefers-color-scheme: dark)',
      ),
      makeRules(2, global),
    )
    .map(([query, body]) => wrapPiece(`@media ${query} {\n`, body, '\n}'));
}

/** A `@keyframes` rule plus a rule that uses it by name. */
function makeKeyframes(): fc.Arbitrary<Piece> {
  return fc
    .tuple(
      fc.constantFrom('spin', 'fade', 'slide-in'),
      fc.constantFrom('animation-name', 'animation'),
      makeDeclarations(1),
      makeDeclarations(1),
    )
    .map(([name, property, from, to]) => {
      const use = property === 'animation' ? `${name} 1s` : name;
      return joinPieces(
        [
          createPiece(`.k { ${property}: ${use}; }\n`),
          wrapPiece(`@keyframes ${name} { from { `, from, ' } '),
          wrapPiece('to { ', to, ' } }'),
        ],
        '',
      );
    });
}

function makeGlobalBlock(): fc.Arbitrary<Piece> {
  return makeRules(2, true).map((body) => wrapPiece('@global {\n', body, '\n}'));
}

/**
 * A `css` template body built from valid selectors, declarations, `@media`,
 * `@keyframes`, `@global`, `:global(...)` and interpolations in property
 * values, including ones followed by a unit (`${props.size}px`).
 *
 * `vars` lists the interpolated expressions in source order. The options turn
 * off the at-rules and `:global` for tests that cannot model them.
 */
export function cssTemplate(opts: CssTemplateOptions = {}): fc.Arbitrary<GeneratedCss> {
  const global = opts.global ?? true;
  const entries: fc.WeightedArbitrary<Piece>[] = [{ weight: 5, arbitrary: makeRule(global) }];
  if (opts.media ?? true) {
    entries.push({ weight: 2, arbitrary: makeMedia(global) });
  }
  if (opts.keyframes ?? true) {
    entries.push({ weight: 1, arbitrary: makeKeyframes() });
  }
  if (global) {
    entries.push({ weight: 1, arbitrary: makeGlobalBlock() });
  }
  return fc.array(fc.oneof(...entries), { minLength: 1, maxLength: 3 }).map((list) => {
    const { text, sample, vars } = joinPieces(list, '\n');
    return { source: text, vars, sample };
  });
}

/**
 * How `css` is brought into the module.
 *
 * - `named`: `import { css }`. `aliased`: `import { css as c }`.
 * - `namespace`: `import * as s`, tag `s.css`.
 * - `with-type`: `import { css, type X }`. `default-and-named`: `import d, { css }`.
 * - `two-aliases`: `import { css, css as c }`, both used as tags.
 * - `type-only`: `import type { css }`. `type-specifier`: `import { type css }`.
 *   A type import has no runtime value, so its templates must not compile.
 * - `foreign`: `import { css } from 'other-styled'`. `none`: no import.
 */
export type ImportForm =
  | 'named'
  | 'aliased'
  | 'namespace'
  | 'with-type'
  | 'default-and-named'
  | 'two-aliases'
  | 'type-only'
  | 'type-specifier'
  | 'foreign'
  | 'none';

export const IMPORT_FORMS: ImportForm[] = [
  'named',
  'aliased',
  'namespace',
  'with-type',
  'default-and-named',
  'two-aliases',
  'type-only',
  'type-specifier',
  'foreign',
  'none',
];

/** The forms `component()` draws from by default: every form. */
export const DEFAULT_IMPORT_FORMS: ImportForm[] = [
  'named',
  'aliased',
  'namespace',
  'with-type',
  'default-and-named',
  'two-aliases',
  'type-only',
  'type-specifier',
  'foreign',
  'none',
];

/** The ways a local binding can hide the imported `css` (or namespace). */
export type ShadowKind =
  | 'let'
  | 'const'
  | 'var-nested'
  | 'var-later'
  | 'var-later-top'
  | 'var-destructured'
  | 'var-labeled'
  | 'parameter'
  | 'parameter-destructured'
  | 'parameter-default'
  | 'class-name'
  | 'class-expression-name'
  | 'switch-case'
  | 'switch-other-case'
  | 'catch-param'
  | 'for-var'
  | 'for-of-var'
  | 'for-let-of'
  | 'function-expression-name';

export const SHADOW_KINDS: ShadowKind[] = [
  'let',
  'const',
  'var-nested',
  'var-later',
  'var-later-top',
  'var-destructured',
  'var-labeled',
  'parameter',
  'parameter-destructured',
  'parameter-default',
  'class-name',
  'class-expression-name',
  'switch-case',
  'switch-other-case',
  'catch-param',
  'for-var',
  'for-of-var',
  'for-let-of',
  'function-expression-name',
];

/**
 * Shadow kinds whose binding is visible in the whole enclosing component, so
 * they also hide `css` from every other template in that component.
 */
export const FUNCTION_SCOPED_SHADOWS: ShadowKind[] = [
  'var-nested',
  'var-later',
  'var-later-top',
  'var-destructured',
  'var-labeled',
  'for-var',
  'for-of-var',
];

/** Same constructs as `SHADOW_KINDS`, placed so that `css` is NOT hidden. */
export type ControlKind =
  | 'switch-outside'
  | 'class-expression-outside'
  | 'for-let-of-outside'
  | 'catch-outside'
  | 'function-expression-outside'
  | 'var-in-sibling-function'
  | 'var-in-arrow'
  | 'var-in-static-block'
  | 'nested-callback';

export const CONTROL_KINDS: ControlKind[] = [
  'switch-outside',
  'class-expression-outside',
  'for-let-of-outside',
  'catch-outside',
  'function-expression-outside',
  'var-in-sibling-function',
  'var-in-arrow',
  'var-in-static-block',
  'nested-callback',
];

export interface ComponentOptions {
  /** Import forms to draw from. Default: `DEFAULT_IMPORT_FORMS`. */
  imports?: readonly ImportForm[];
  /** Shadow kinds to draw from. Default: `SHADOW_KINDS`. `[]` disables them. */
  shadows?: readonly ShadowKind[];
  /** Control kinds to draw from. Default: `CONTROL_KINDS`. `[]` disables them. */
  controls?: readonly ControlKind[];
  /** Allow `<style jsx>` and `<style jsx global>`. Default: true. */
  styleJsx?: boolean;
  /** Allow `use:solid-styled` on component elements. Default: true. */
  useAttribute?: boolean;
  /**
   * Allow a module-level `var` in a nested block that hides `css` in every
   * component. It redeclares the import, which is an early error in JS that
   * oxc-parser accepts and Babel rejects. Default: true.
   */
  modulePoison?: boolean;
  /** Maximum number of components in the module. Default: 2. */
  maxComponents?: number;
  /** Options for every generated template. Default: everything on. */
  css?: CssTemplateOptions;
}

export type TemplateKind = 'css' | 'style' | 'global';

export interface GeneratedTemplate {
  /**
   * A `/*t<N>*\/` comment at the start of the template body, unique in the
   * module. Compiling minifies it away, so it stays in the output (right after
   * a backtick) exactly when the template is left as is.
   */
  marker: string;
  /** `css` for a tagged template, `style` or `global` for `<style jsx>`. */
  kind: TemplateKind;
  /** True when the template must compile; false when it must be left as is. */
  compiled: boolean;
  /** The interpolated expressions, in source order. */
  vars: string[];
}

export interface GeneratedModule {
  /** The module source. TSX syntax. Parses without errors. */
  code: string;
  importForm: ImportForm;
  /** Every template in the module, in source order. */
  templates: GeneratedTemplate[];
}

const COMPILED_CALLEE = /^_?useSolidStyled(Global)?(_\d+)?$/;

/** Counts calls to an identifier matching `COMPILED_CALLEE` in a parsed tree. */
function countCalls(node: unknown): number {
  if (node === null || typeof node !== 'object') {
    return 0;
  }
  if (Array.isArray(node)) {
    let total = 0;
    for (const child of node) {
      total += countCalls(child);
    }
    return total;
  }
  const record = node as Record<string, unknown>;
  let total = 0;
  if (record.type === 'CallExpression') {
    const callee = record.callee as { type?: string; name?: string };
    if (callee.type === 'Identifier' && COMPILED_CALLEE.test(callee.name ?? '')) {
      total += 1;
    }
  }
  for (const key in record) {
    if (key !== 'parent') {
      total += countCalls(record[key]);
    }
  }
  return total;
}

/**
 * Counts the compiled templates in compiler output. Each compiled template
 * becomes one call to `useSolidStyled` or `useSolidStyledGlobal` under the
 * local name the compiler picked: `_useSolidStyled`, `_useSolidStyled_1` when
 * the source already uses `_useSolidStyled`, or `useSolidStyled_1` in 0.12.1.
 * Throws when the output does not parse.
 */
export function countCompiled(code: string): number {
  const result = parseSync('output.tsx', code, { lang: 'tsx', sourceType: 'module' });
  if (result.errors.length > 0) {
    throw new Error(`output does not parse: ${result.errors[0].message}`);
  }
  return countCalls(result.program);
}

interface TagSetup {
  /** The tag expression. */
  tag: string;
  /** The local binding that may be shadowed. */
  local: string;
  /** What a shadowing declaration assigns to `local`. */
  initializer: string;
}

interface ImportSetup {
  /** The import line, or ''. */
  line: string;
  /** The tags in use. Most forms have one; `two-aliases` has two. */
  tags: TagSetup[];
  /** True when the tags resolve to solid-styled's `css`. */
  live: boolean;
}

const CSS_TAG: TagSetup = { tag: 'css', local: 'css', initializer: 'String.raw' };

function setupImport(form: ImportForm): ImportSetup {
  const from = "from 'solid-styled';";
  switch (form) {
    case 'named':
      return { line: `import { css } ${from}`, tags: [CSS_TAG], live: true };
    case 'aliased':
      return {
        line: `import { css as c } ${from}`,
        tags: [{ tag: 'c', local: 'c', initializer: 'String.raw' }],
        live: true,
      };
    case 'namespace':
      return {
        line: `import * as s ${from}`,
        tags: [{ tag: 's.css', local: 's', initializer: '{ css: String.raw }' }],
        live: true,
      };
    case 'with-type':
      return { line: `import { css, type CSSProperties } ${from}`, tags: [CSS_TAG], live: true };
    case 'default-and-named':
      return { line: `import styled, { css } ${from}`, tags: [CSS_TAG], live: true };
    case 'two-aliases':
      return {
        line: `import { css, css as c } ${from}`,
        tags: [CSS_TAG, { tag: 'c', local: 'c', initializer: 'String.raw' }],
        live: true,
      };
    case 'type-only':
      return { line: `import type { css } ${from}`, tags: [CSS_TAG], live: false };
    case 'type-specifier':
      return { line: `import { type css } ${from}`, tags: [CSS_TAG], live: false };
    case 'foreign':
      return { line: "import { css } from 'other-styled';", tags: [CSS_TAG], live: false };
    default:
      // No import at all. A bare `css` tag is a free variable, so it stays.
      return { line: '', tags: [CSS_TAG], live: false };
  }
}

/** Wraps a template statement in a construct that hides the tag's binding. */
function renderShadow(kind: ShadowKind, tag: TagSetup, t: string, id: number): string {
  const { local, initializer } = tag;
  switch (kind) {
    case 'let':
      return `{ let ${local} = ${initializer}; ${t} }`;
    case 'const':
      return `{ const ${local} = ${initializer}; ${t} }`;
    case 'var-nested':
      return `if (globalThis.a) { var ${local} = ${initializer}; }\n${t}`;
    case 'var-later':
      return `${t}\nif (globalThis.a) { var ${local} = ${initializer}; }`;
    case 'var-later-top':
      return `${t}\nvar ${local} = ${initializer};`;
    case 'var-destructured':
      return `{ var { ${local} } = { ${local}: ${initializer} }; }\n${t}`;
    case 'var-labeled':
      return `label_${id}: { var ${local} = ${initializer}; }\n${t}`;
    case 'parameter':
      return `function inner_${id}(${local}: any) { ${t} }`;
    case 'parameter-destructured':
      return `function inner_${id}({ ${local} }: any) { ${t} }`;
    case 'parameter-default':
      return `function inner_${id}(${local} = ${initializer}) { ${t} }`;
    case 'class-name':
      return `function w_${id}() { class ${local} {}\n${t} }`;
    case 'class-expression-name':
      return `const k_${id} = class ${local} { m() { ${t} } };`;
    case 'switch-case':
      return `switch (globalThis.x) { case 0: let ${local} = ${initializer}; ${t} }`;
    case 'switch-other-case':
      return `switch (globalThis.x) { case 0: let ${local} = ${initializer}; break; case 1: ${t} }`;
    case 'catch-param':
      return `try {} catch (${local}) { ${t} }`;
    case 'for-var':
      return `for (var ${local} = ${initializer}; false; ) {}\n${t}`;
    case 'for-of-var':
      return `for (var ${local} of [${initializer}]) {}\n${t}`;
    case 'for-let-of':
      return `for (let ${local} of [${initializer}]) { ${t} }`;
    default:
      return `const f_${id} = function ${local}() { ${t} };`;
  }
}

/** Wraps a template statement in a construct that leaves the binding visible. */
function renderControl(kind: ControlKind, tag: TagSetup, t: string, id: number): string {
  const { local, initializer } = tag;
  switch (kind) {
    case 'switch-outside':
      return `switch (globalThis.x) { case 0: let ${local} = ${initializer}; }\n${t}`;
    case 'class-expression-outside':
      return `const k_${id} = class ${local} {};\n${t}`;
    case 'for-let-of-outside':
      return `for (let ${local} of [${initializer}]) {}\n${t}`;
    case 'catch-outside':
      return `try {} catch (${local}) {}\n${t}`;
    case 'function-expression-outside':
      return `const f_${id} = function ${local}() {};\n${t}`;
    case 'var-in-sibling-function':
      return `function sibling_${id}() { if (globalThis.a) { var ${local} = ${initializer}; } }\n${t}`;
    case 'var-in-arrow':
      return `const g_${id} = () => { { var ${local} = ${initializer}; } };\n${t}`;
    case 'var-in-static-block':
      return `class S_${id} { static { { var ${local} = ${initializer}; } } }\n${t}`;
    default:
      // The template sits in a callback inside the component, and compiles there.
      return `const cb_${id} = () => { ${t} };`;
  }
}

type Item =
  | { kind: 'plain'; tag: number; css: GeneratedCss }
  | { kind: 'shadow'; tag: number; shadow: ShadowKind; css: GeneratedCss }
  | { kind: 'control'; tag: number; control: ControlKind; css: GeneratedCss }
  | { kind: 'style'; global: boolean; list: GeneratedCss[] };

interface ComponentSpec {
  items: Item[];
  arrow: boolean;
  exported: boolean;
  useAttribute: boolean;
}

interface ModuleSpec {
  form: ImportForm;
  /** A module-level `var` that hides the first tag in every component. */
  poison: boolean;
  components: ComponentSpec[];
}

function renderModule(spec: ModuleSpec): GeneratedModule {
  const setup = setupImport(spec.form);
  const templates: GeneratedTemplate[] = [];
  const out: string[] = [];
  if (setup.line) {
    out.push(setup.line);
  }

  // Locals hidden in every component by a module-level `var`.
  const modulePoisoned = new Set<string>();
  if (spec.poison) {
    const first = setup.tags[0];
    out.push(`if (globalThis.a) { var ${first.local} = ${first.initializer}; }`);
    modulePoisoned.add(first.local);
  }

  let id = 0;
  function addTemplate(css: GeneratedCss, kind: TemplateKind, compiled: boolean): string {
    id += 1;
    const marker = `/*t${id}*/`;
    templates.push({ marker, kind, compiled, vars: css.vars });
    return `\`${marker}${css.source}\``;
  }

  for (const [index, comp] of spec.components.entries()) {
    const body: string[] = [];
    const jsx: string[] = [];

    // A function-scoped `var` hides its local from every template in the component.
    const poisoned = new Set(modulePoisoned);
    for (const entry of comp.items) {
      if (entry.kind === 'shadow' && FUNCTION_SCOPED_SHADOWS.includes(entry.shadow)) {
        poisoned.add(setup.tags[entry.tag % setup.tags.length].local);
      }
    }

    for (const entry of comp.items) {
      if (entry.kind === 'style') {
        let children = '';
        for (const css of entry.list) {
          children += `{${addTemplate(css, entry.global ? 'global' : 'style', true)}}`;
        }
        jsx.push(`<style jsx${entry.global ? ' global' : ''}>${children}</style>`);
        continue;
      }
      const tag = setup.tags[entry.tag % setup.tags.length];
      const compiled = setup.live && !poisoned.has(tag.local) && entry.kind !== 'shadow';
      const t = `${tag.tag}${addTemplate(entry.css, 'css', compiled)};`;
      if (entry.kind === 'plain') {
        body.push(t);
      } else if (entry.kind === 'shadow') {
        body.push(renderShadow(entry.shadow, tag, t, id));
      } else {
        body.push(renderControl(entry.control, tag, t, id));
      }
    }

    if (comp.useAttribute) {
      jsx.push('<Child use:solid-styled />');
    }
    const inner = `${body.join('\n')}\nreturn <div class="root">${jsx.join('')}<h1>Hello</h1></div>;`;
    const prefix = comp.exported ? 'export ' : '';
    const name = `Comp${index}`;
    out.push(
      comp.arrow
        ? `${prefix}const ${name} = (props: any) => {\n${inner}\n};`
        : `${prefix}function ${name}(props: any) {\n${inner}\n}`,
    );
  }

  return { code: `${out.join('\n\n')}\n`, importForm: spec.form, templates };
}

function makeItem(opts: Required<ComponentOptions>, form: ImportForm): fc.Arbitrary<Item> {
  const css = cssTemplate(opts.css);
  const tag = fc.integer({ min: 0, max: 1 });
  const options: fc.Arbitrary<Item>[] = [];
  if (form !== 'none') {
    options.push(fc.tuple(tag, css).map(([t, c]): Item => ({ kind: 'plain', tag: t, css: c })));
    if (opts.shadows.length > 0) {
      options.push(
        fc
          .tuple(tag, fc.constantFrom(...opts.shadows), css)
          .map(([t, shadow, c]): Item => ({ kind: 'shadow', tag: t, shadow, css: c })),
      );
    }
    if (opts.controls.length > 0) {
      options.push(
        fc
          .tuple(tag, fc.constantFrom(...opts.controls), css)
          .map(([t, control, c]): Item => ({ kind: 'control', tag: t, control, css: c })),
      );
    }
  }
  if (opts.styleJsx) {
    options.push(
      fc
        .tuple(fc.boolean(), fc.array(css, { minLength: 1, maxLength: 3 }))
        .map(([global, list]): Item => ({ kind: 'style', global, list })),
    );
  }
  if (options.length === 0) {
    // Nothing else allowed: fall back to a plain template.
    options.push(fc.tuple(tag, css).map(([t, c]): Item => ({ kind: 'plain', tag: t, css: c })));
  }
  return fc.oneof(...options);
}

/**
 * A TSX module that imports `css` in one of the `ImportForm`s, declares one or
 * more components that call `css` and `<style jsx>`, and shadows the import
 * locally in many ways.
 *
 * Each template carries a unique marker and says whether it must compile, so
 * tests can assert which templates remain. `countCompiled(output)` equals the
 * number of templates with `compiled: true`.
 */
export function component(opts: ComponentOptions = {}): fc.Arbitrary<GeneratedModule> {
  const full: Required<ComponentOptions> = {
    imports: opts.imports ?? DEFAULT_IMPORT_FORMS,
    shadows: opts.shadows ?? SHADOW_KINDS,
    controls: opts.controls ?? CONTROL_KINDS,
    styleJsx: opts.styleJsx ?? true,
    useAttribute: opts.useAttribute ?? true,
    modulePoison: opts.modulePoison ?? true,
    maxComponents: opts.maxComponents ?? 2,
    css: opts.css ?? {},
  };

  return fc.constantFrom(...full.imports).chain((form) => {
    const componentSpec = fc.record({
      items: fc.array(makeItem(full, form), { minLength: 1, maxLength: 3 }),
      arrow: fc.boolean(),
      exported: fc.boolean(),
      useAttribute: full.useAttribute ? fc.boolean() : fc.constant(false),
    });
    // A rare module-level `var`: it hides the first tag everywhere.
    const poison =
      full.modulePoison && form !== 'none'
        ? fc.integer({ min: 0, max: 7 }).map((n) => n === 0)
        : fc.constant(false);
    return fc
      .tuple(poison, fc.array(componentSpec, { minLength: 1, maxLength: full.maxComponents }))
      .map(([p, components]) => renderModule({ form, poison: p, components }));
  });
}

/** The documented cases where `compile` throws a `CompileError`. */
export type InvalidReason = 'expression-body' | 'style-value' | 'syntax';

export interface InvalidModule {
  code: string;
  reason: InvalidReason;
}

/**
 * A module that `compile` must reject with a `CompileError`:
 *
 * - `expression-body`: an arrow component with an expression body holds a
 *   `<style jsx>` with an interpolation. The variable holder needs a block body.
 * - `style-value`: an element with interpolated styles has a `style` value that
 *   is neither a string nor an expression (`style=<b />`).
 * - `syntax`: the module does not parse.
 */
export function invalidComponent(): fc.Arbitrary<InvalidModule> {
  // A trailing rule makes sure the template has at least one interpolation.
  const css = cssTemplate().map((c) => `${c.source}\n.v { color: \${props.color}; }`);
  const expressionBody = fc.tuple(css, fc.boolean()).map(([source, exported]): InvalidModule => {
    const prefix = exported ? 'export ' : '';
    return {
      code: `${prefix}const Comp = (props: any) => <div><style jsx>{\`${source}\`}</style></div>;\n`,
      reason: 'expression-body',
    };
  });
  const styleValue = css.map((source): InvalidModule => ({
    code: `export function Comp(props: any) {\nreturn <div style=<b />><style jsx>{\`${source}\`}</style></div>;\n}\n`,
    reason: 'style-value',
  }));
  const syntax = css.map((source): InvalidModule => ({
    code: `import { css } from 'solid-styled';\nexport function Comp(props: any) {\ncss\`${source}\`;\nconst = ;\n}\n`,
    reason: 'syntax',
  }));
  return fc.oneof(expressionBody, styleValue, syntax);
}
