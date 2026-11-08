import fc from 'fast-check';

/**
 * Shared fast-check generators for compiler tests.
 *
 * Every generator keeps its output small (a few rules, a few components) so
 * that shrinking stays fast and a failing counterexample is readable.
 */

// ---------------------------------------------------------------------------
// CSS
// ---------------------------------------------------------------------------

export interface GeneratedCss {
  /** The body of a `css` template, with `${expr}` spans in place. */
  source: string;
  /** The interpolated expressions, in source order. */
  vars: string[];
}

const NAMES = ['a', 'b', 'box', 'item', 'row', 'x1', 'my-class'];
const TYPES = ['div', 'span', 'h1', 'p', 'a', 'ul', 'li', 'button'];
const PSEUDO_CLASSES = [':hover', ':focus', ':first-child', ':not(.off)'];
const PSEUDO_ELEMENTS = ['::before', '::after'];
const COMBINATORS = [' ', ' > ', ' + ', ' ~ '];

/** Interpolation names. Each one is an expression over the `props` parameter. */
const PROP_NAMES = ['color', 'size', 'gap', 'ms', 'opacity'];

/** Units the compiler recognizes right after an interpolation. */
export const UNITS = ['px', 'em', 'rem', '%', 'vw', 'vh', 'ms', 's', 'deg', 'fr', 'ch', 'pt'];

/** Fixed values; each is valid for the property group named by its key. */
const STATIC_VALUES = {
  color: ['red', 'blue', '#fff', '#112233', 'rgb(1, 2, 3)', 'transparent'],
  length: ['0', '1px', '2em', '50%', '10rem', 'auto'],
  number: ['0', '1', '0.5'],
  time: ['1s', '200ms'],
} as const;

type ValueKind = keyof typeof STATIC_VALUES;

/** Properties grouped by the kind of value they take. */
const PROPERTIES: Record<ValueKind, string[]> = {
  color: ['color', 'background-color', 'border-color'],
  length: ['width', 'height', 'margin', 'padding', 'top', 'left', 'font-size'],
  number: ['opacity', 'flex-grow', 'z-index'],
  time: ['transition-duration', 'animation-duration'],
};

const KINDS = Object.keys(PROPERTIES) as ValueKind[];

/** One `${props.x}` span; the expression is recorded for the caller. */
function interpolation(): fc.Arbitrary<{ text: string; expr: string }> {
  return fc.constantFrom(...PROP_NAMES).map((name) => {
    const expr = `props.${name}`;
    return { text: `\${${expr}}`, expr };
  });
}

/** A value made of fixed words and interpolations, with optional units. */
function value(kind: ValueKind): fc.Arbitrary<{ text: string; vars: string[] }> {
  const fixed = fc
    .constantFrom(...STATIC_VALUES[kind])
    .map((text) => ({ text, vars: [] as string[] }));
  const dynamic = interpolation().map(({ text, expr }) => ({ text, vars: [expr] }));
  // `${x}px`: the unit follows the interpolation with no space.
  const withUnit = fc
    .tuple(interpolation(), fc.constantFrom(...UNITS))
    .map(([{ text, expr }, unit]) => ({ text: `${text}${unit}`, vars: [expr] }));
  const single = fc.oneof(fixed, fixed, dynamic, withUnit);
  return fc.array(single, { minLength: 1, maxLength: kind === 'length' ? 3 : 1 }).map((parts) => ({
    text: parts.map((part) => part.text).join(' '),
    vars: parts.flatMap((part) => part.vars),
  }));
}

interface Declaration {
  text: string;
  vars: string[];
}

function declaration(): fc.Arbitrary<Declaration> {
  return fc.constantFrom(...KINDS).chain((kind) =>
    fc.tuple(fc.constantFrom(...PROPERTIES[kind]), value(kind)).map(([property, v]) => ({
      text: `${property}: ${v.text};`,
      vars: v.vars,
    })),
  );
}

function declarations(max = 3): fc.Arbitrary<Declaration[]> {
  return fc.array(declaration(), { minLength: 1, maxLength: max });
}

/** A compound selector: type, class, id, attribute or universal, plus pseudos. */
function compound(allowPseudoElement: boolean): fc.Arbitrary<string> {
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

/** `:global(.x)` as a whole compound, so the scope marker is skipped for it. */
function globalCompound(): fc.Arbitrary<string> {
  return fc.constantFrom(...NAMES).map((name) => `:global(.${name})`);
}

function selector(allowPseudoElement = true): fc.Arbitrary<string> {
  const part = fc.oneof(compound(false), compound(false), globalCompound());
  const last = fc.oneof(
    compound(allowPseudoElement),
    compound(allowPseudoElement),
    globalCompound(),
  );
  return fc
    .tuple(fc.array(fc.tuple(part, fc.constantFrom(...COMBINATORS)), { maxLength: 2 }), last)
    .map(([prefix, tail]) => `${prefix.map(([p, c]) => `${p}${c}`).join('')}${tail}`);
}

function selectorList(): fc.Arbitrary<string> {
  return fc.array(selector(), { minLength: 1, maxLength: 2 }).map((list) => list.join(', '));
}

interface Piece {
  text: string;
  vars: string[];
}

function join(declList: Declaration[]): Piece {
  return {
    text: declList.map((d) => d.text).join(' '),
    vars: declList.flatMap((d) => d.vars),
  };
}

/** A style rule, optionally with one nested rule (CSS nesting with `&`). */
function rule(): fc.Arbitrary<Piece> {
  const plain = fc.tuple(selectorList(), declarations()).map(([sel, decls]): Piece => {
    const body = join(decls);
    return { text: `${sel} { ${body.text} }`, vars: body.vars };
  });
  const nested = fc
    .tuple(
      // A pseudo element cannot be followed by a nested rule.
      selector(false).filter((sel) => !sel.includes('::')),
      declarations(2),
      fc.constantFrom('& ', '& > ', '&.on ', '& + '),
      selector(false),
      declarations(2),
    )
    .map(([outer, outerDecls, amp, inner, innerDecls]): Piece => {
      const a = join(outerDecls);
      const b = join(innerDecls);
      return {
        text: `${outer} { ${a.text} ${amp}${inner} { ${b.text} } }`,
        vars: [...a.vars, ...b.vars],
      };
    });
  return fc.oneof(plain, plain, nested);
}

function rules(max: number): fc.Arbitrary<Piece> {
  return fc.array(rule(), { minLength: 1, maxLength: max }).map((list) => ({
    text: list.map((r) => r.text).join('\n'),
    vars: list.flatMap((r) => r.vars),
  }));
}

function media(): fc.Arbitrary<Piece> {
  return fc
    .tuple(
      fc.constantFrom(
        '(min-width: 600px)',
        '(max-width: 40em)',
        'screen',
        '(prefers-color-scheme: dark)',
      ),
      rules(2),
    )
    .map(([query, body]) => ({ text: `@media ${query} {\n${body.text}\n}`, vars: body.vars }));
}

/** A `@keyframes` rule plus a rule that uses it by name. */
function keyframes(): fc.Arbitrary<Piece> {
  return fc
    .tuple(
      fc.constantFrom('spin', 'fade', 'slide-in'),
      fc.constantFrom('animation-name', 'animation'),
      declarations(1),
      declarations(1),
    )
    .map(([name, property, from, to]): Piece => {
      const start = join(from);
      const end = join(to);
      const use = property === 'animation' ? `${name} 1s` : name;
      return {
        text: `.k { ${property}: ${use}; }\n@keyframes ${name} { from { ${start.text} } to { ${end.text} } }`,
        vars: [...start.vars, ...end.vars],
      };
    });
}

function globalBlock(): fc.Arbitrary<Piece> {
  return rules(2).map((body) => ({ text: `@global {\n${body.text}\n}`, vars: body.vars }));
}

/**
 * A `css` template body built from valid selectors, declarations, `@media`,
 * `@keyframes`, `@global`, `:global(...)` and interpolations in property
 * values, including ones followed by a unit (`${props.size}px`).
 *
 * `vars` lists the interpolated expressions in source order.
 */
export function cssTemplate(): fc.Arbitrary<GeneratedCss> {
  const entry = fc.oneof(
    { weight: 5, arbitrary: rule() },
    { weight: 2, arbitrary: media() },
    { weight: 1, arbitrary: keyframes() },
    { weight: 1, arbitrary: globalBlock() },
  );
  return fc.array(entry, { minLength: 1, maxLength: 3 }).map((list) => ({
    source: list.map((piece) => piece.text).join('\n'),
    vars: list.flatMap((piece) => piece.vars),
  }));
}

// ---------------------------------------------------------------------------
// Modules
// ---------------------------------------------------------------------------

/** How `css` is brought into the module. */
export type ImportForm = 'named' | 'aliased' | 'namespace' | 'foreign' | 'none';

/** The ways a local binding can hide the imported `css` (or namespace). */
export type ShadowKind =
  | 'let'
  | 'var-nested'
  | 'var-later'
  | 'parameter'
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
  'var-nested',
  'var-later',
  'parameter',
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
  | 'var-in-static-block';

export const CONTROL_KINDS: ControlKind[] = [
  'switch-outside',
  'class-expression-outside',
  'for-let-of-outside',
  'catch-outside',
  'function-expression-outside',
  'var-in-sibling-function',
  'var-in-arrow',
  'var-in-static-block',
];

export interface ComponentOptions {
  /** Import forms to draw from. Default: all of them. */
  imports?: readonly ImportForm[];
  /** Shadow kinds to draw from. Default: `SHADOW_KINDS`. `[]` disables them. */
  shadows?: readonly ShadowKind[];
  /** Control kinds to draw from. Default: `CONTROL_KINDS`. `[]` disables them. */
  controls?: readonly ControlKind[];
  /** Allow `<style jsx>` and `<style jsx global>`. Default: true. */
  styleJsx?: boolean;
  /** Allow `use:solid-styled` on component elements. Default: true. */
  useAttribute?: boolean;
  /** Maximum number of components in the module. Default: 2. */
  maxComponents?: number;
}

export interface GeneratedModule {
  /** The module source. TSX syntax. Parses without errors. */
  code: string;
  /** The `css` and `<style jsx>` templates that must compile. */
  expectedCompiled: number;
  /** The `css` templates that must be left as is (shadowed, or not from solid-styled). */
  expectedUntouched: number;
  /** Of `expectedCompiled`: how many are `<style jsx global>` templates. */
  expectedGlobal: number;
  /** Of `expectedCompiled`: how many are tagged `css` templates. */
  expectedCss: number;
  /** Of `expectedCompiled`: how many are `<style jsx>` templates (global or not). */
  expectedStyle: number;
  importForm: ImportForm;
  /** The bindings used: local name of `css` (or of the namespace). */
  local: string;
  /** Every interpolated expression, per compiled or untouched template. */
  vars: string[];
}

/**
 * Pattern that matches one compiled template in the output. Each compiled
 * template becomes exactly one `useSolidStyled(` or `useSolidStyledGlobal(`
 * call, possibly with an underscore prefix. The import line has no `(`.
 */
export const COMPILED_CALL = /useSolidStyled(?:Global)?\(/g;

interface Template {
  /** Tag expression text plus the template, ready to use as a statement. */
  statement: (tag: string) => string;
  vars: string[];
}

function cssStatement(css: GeneratedCss): Template {
  return {
    statement: (tag) => `${tag}\`${css.source}\`;`,
    vars: css.vars,
  };
}

interface ImportSetup {
  form: ImportForm;
  /** The import lines. */
  lines: string;
  /** The local name that may be shadowed. */
  local: string;
  /** The tag expression. */
  tag: string;
  /** What a shadowing declaration assigns to `local`. */
  initializer: string;
  /** True when the tag resolves to solid-styled's `css`. */
  live: boolean;
}

function importSetup(form: ImportForm): ImportSetup {
  switch (form) {
    case 'named':
      return {
        form,
        lines: "import { css } from 'solid-styled';",
        local: 'css',
        tag: 'css',
        initializer: 'String.raw',
        live: true,
      };
    case 'aliased':
      return {
        form,
        lines: "import { css as c } from 'solid-styled';",
        local: 'c',
        tag: 'c',
        initializer: 'String.raw',
        live: true,
      };
    case 'namespace':
      return {
        form,
        lines: "import * as s from 'solid-styled';",
        local: 's',
        tag: 's.css',
        initializer: '{ css: String.raw }',
        live: true,
      };
    case 'foreign':
      return {
        form,
        lines: "import { css } from 'other-styled';",
        local: 'css',
        tag: 'css',
        initializer: 'String.raw',
        live: false,
      };
    default:
      // No import at all. A bare `css` tag is a free variable, so it stays.
      return {
        form,
        lines: '',
        local: 'css',
        tag: 'css',
        initializer: 'String.raw',
        live: false,
      };
  }
}

/** Wraps a template statement in a construct that hides the import. */
function shadowed(kind: ShadowKind, setup: ImportSetup, t: string, id: string): string {
  const { local, initializer } = setup;
  switch (kind) {
    case 'let':
      return `{ let ${local} = ${initializer}; ${t} }`;
    case 'var-nested':
      return `if (globalThis.a) { var ${local} = ${initializer}; }\n${t}`;
    case 'var-later':
      return `${t}\nif (globalThis.a) { var ${local} = ${initializer}; }`;
    case 'parameter':
      return `function inner_${id}(${local}) { ${t} }`;
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

/** Wraps a template statement in a construct that leaves the import visible. */
function control(kind: ControlKind, setup: ImportSetup, t: string, id: string): string {
  const { local, initializer } = setup;
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
    default:
      return `class S_${id} { static { { var ${local} = ${initializer}; } } }\n${t}`;
  }
}

type Item =
  | { kind: 'plain'; css: GeneratedCss }
  | { kind: 'shadow'; shadow: ShadowKind; css: GeneratedCss }
  | { kind: 'control'; control: ControlKind; css: GeneratedCss }
  | { kind: 'style'; global: boolean; css: GeneratedCss };

interface ComponentSpec {
  items: Item[];
  arrow: boolean;
  exported: boolean;
  useAttribute: boolean;
}

interface ModuleSpec {
  form: ImportForm;
  components: ComponentSpec[];
}

interface Counts {
  compiled: number;
  untouched: number;
  global: number;
  css: number;
  style: number;
}

function renderModule(spec: ModuleSpec): { code: string; counts: Counts; vars: string[] } {
  const setup = importSetup(spec.form);
  const counts: Counts = { compiled: 0, untouched: 0, global: 0, css: 0, style: 0 };
  const vars: string[] = [];
  const out: string[] = [];
  if (setup.lines) {
    out.push(setup.lines);
  }

  let id = 0;
  for (const [index, comp] of spec.components.entries()) {
    const name = `Comp${index}`;
    const body: string[] = [];
    const jsx: string[] = [];

    // A function-scoped `var` hides `css` from every template in the component.
    let poisoned = false;
    for (const entry of comp.items) {
      if (entry.kind === 'shadow' && FUNCTION_SCOPED_SHADOWS.includes(entry.shadow)) {
        poisoned = true;
      }
    }

    for (const entry of comp.items) {
      id += 1;
      vars.push(...entry.css.vars);
      if (entry.kind === 'style') {
        counts.compiled += 1;
        counts.style += 1;
        if (entry.global) {
          counts.global += 1;
        }
        jsx.push(`<style jsx${entry.global ? ' global' : ''}>{\`${entry.css.source}\`}</style>`);
        continue;
      }
      const t = cssStatement(entry.css).statement(setup.tag);
      let text: string;
      let compiled = setup.live && !poisoned;
      if (entry.kind === 'plain') {
        text = t;
      } else if (entry.kind === 'shadow') {
        text = shadowed(entry.shadow, setup, t, String(id));
        compiled = false;
      } else {
        text = control(entry.control, setup, t, String(id));
      }
      body.push(text);
      if (compiled) {
        counts.compiled += 1;
        counts.css += 1;
      } else {
        counts.untouched += 1;
      }
    }

    if (comp.useAttribute) {
      jsx.push('<Child use:solid-styled />');
    }
    const ret = `return <div class="root">${jsx.join('')}<h1>Hello</h1></div>;`;
    const inner = `${body.join('\n')}\n${ret}`;
    const exportPrefix = comp.exported ? 'export ' : '';
    out.push(
      comp.arrow
        ? `${exportPrefix}const ${name} = (props: any) => {\n${inner}\n};`
        : `${exportPrefix}function ${name}(props: any) {\n${inner}\n}`,
    );
  }

  return { code: `${out.join('\n\n')}\n`, counts, vars };
}

function itemArbitrary(opts: Required<ComponentOptions>, form: ImportForm): fc.Arbitrary<Item> {
  const css = cssTemplate();
  const options: fc.Arbitrary<Item>[] = [];
  if (form !== 'none') {
    options.push(css.map((c): Item => ({ kind: 'plain', css: c })));
  }
  if (form !== 'none' && opts.shadows.length > 0) {
    options.push(
      fc
        .tuple(fc.constantFrom(...opts.shadows), css)
        .map(([shadow, c]): Item => ({ kind: 'shadow', shadow, css: c })),
    );
  }
  if (form !== 'none' && opts.controls.length > 0) {
    options.push(
      fc
        .tuple(fc.constantFrom(...opts.controls), css)
        .map(([ctl, c]): Item => ({ kind: 'control', control: ctl, css: c })),
    );
  }
  if (opts.styleJsx) {
    options.push(
      fc.tuple(fc.boolean(), css).map(([global, c]): Item => ({ kind: 'style', global, css: c })),
    );
  }
  if (options.length === 0) {
    // Nothing else allowed: fall back to a plain template.
    options.push(css.map((c): Item => ({ kind: 'plain', css: c })));
  }
  return fc.oneof(...options);
}

/**
 * A TSX module that imports `css` (named, aliased, namespaced, from another
 * package, or not at all), declares one or more components that call `css`
 * and `<style jsx>`, and shadows the import locally in many ways.
 *
 * The result says how many templates must compile, so the tests can assert on
 * it. See `COMPILED_CALL` for the marker to count in the output.
 */
export function component(opts: ComponentOptions = {}): fc.Arbitrary<GeneratedModule> {
  const full: Required<ComponentOptions> = {
    imports: opts.imports ?? ['named', 'aliased', 'namespace', 'foreign', 'none'],
    shadows: opts.shadows ?? SHADOW_KINDS,
    controls: opts.controls ?? CONTROL_KINDS,
    styleJsx: opts.styleJsx ?? true,
    useAttribute: opts.useAttribute ?? true,
    maxComponents: opts.maxComponents ?? 2,
  };

  const componentSpec = (form: ImportForm): fc.Arbitrary<ComponentSpec> =>
    fc.record({
      items: fc.array(itemArbitrary(full, form), { minLength: 1, maxLength: 3 }),
      arrow: fc.boolean(),
      exported: fc.boolean(),
      useAttribute: full.useAttribute ? fc.boolean() : fc.constant(false),
    });

  return fc.constantFrom(...full.imports).chain((form) =>
    fc
      .array(componentSpec(form), { minLength: 1, maxLength: full.maxComponents })
      .map((components) => {
        const { code, counts, vars } = renderModule({ form, components });
        const setup = importSetup(form);
        return {
          code,
          expectedCompiled: counts.compiled,
          expectedUntouched: counts.untouched,
          expectedGlobal: counts.global,
          expectedCss: counts.css,
          expectedStyle: counts.style,
          importForm: form,
          local: setup.local,
          vars,
        };
      }),
  );
}
