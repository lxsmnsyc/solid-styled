// Differential test: the 1.0 compiler against the Babel compiler of 0.12.1.
// Both compile the same generated module with the same options. The test
// parses both outputs and compares what the compilers produce (sheets, scope
// ids, runtime calls, JSX attributes), not the formatting of the code.
import fc from 'fast-check';
import { parseSync } from 'oxc-parser';
import { compile as compileLegacy } from 'solid-styled-legacy/compiler';
import { describe, expect, it } from 'vitest';
import { type SolidStyledOptions, compile } from '../compiler';
import { type GeneratedModule, UNITS, component } from './arbitraries';

// Set FC_RUNS and FC_SEED to search wider than the default run.
const RUNS = Number(process.env.FC_RUNS ?? 300);
const SEED = Number(process.env.FC_SEED ?? 20261108);

// The timeout grows with FC_RUNS: about 50 ms per run, at least 10 s.
const TIMEOUT = Math.max(10_000, RUNS * 50);

/** The names the runtime exports to compiled code. */
const RUNTIME_HELPERS = new Set([
  'useSolidStyled',
  'useSolidStyledGlobal',
  'createCSSVars',
  'mergeStyles',
]);

const SHEET_ID = /^sheet_\d+$/;
const CSS_ID = /^css_\d+$/;
const VARS_ID = /^vars_\d+$/;
const MARKER = /^\/\*t\d+\*\//;

// Intended difference: a unit written right after an interpolation. 1.0
// emits `calc(var(--id) * 1px)`, a valid value that lightningcss parses and
// minifies (`calc(var(--id)*1px)`, `calc(...)50%0`). 0.12.1 emits `var(--id) px`
// or `var(--id)px`, which browsers drop and lightningcss prints token by
// token. In the extracted sheet strings (never in the code), both forms become
// `<unit --id px>`. 1.0 minifies a declaration that holds one as a token list,
// so it drops each space that ends no token: after `%`, `)` and the unit
// (`50% 0` becomes `50%0`). 0.12.1 keeps them. In such a declaration the
// filter drops only those spaces. A space after a number or a word stays,
// since dropping it would join two tokens (`0 calc(` is not `0calc(`).
const UNIT_LIST = [...UNITS.length, ...UNITS.time].join('|');
const UNIT_CALC = new RegExp(`calc\\(var\\((--[\\w-]+)\\) ?\\* ?1(${UNIT_LIST})\\)`, 'g');
const UNIT_SPACED = new RegExp(`var\\((--[\\w-]+)\\) ?(${UNIT_LIST})(?![\\w-])`, 'g');
const UNIT_DECLARATION = /[\w-]+:[^;{}]*<unit [^;{}]*/g;
const TOKEN_END_SPACE = /(?<=[%)>]) /g;

function dropTokenEndSpaces(declaration: string): string {
  return declaration.replace(TOKEN_END_SPACE, '');
}

/** What both compilers must agree on, with names and formatting normalized. */
interface Artifacts {
  /** Per template marker: true when the template was compiled away. */
  compiled: Record<string, boolean>;
  /** `css_N = "<sheet>"` constants, in order. */
  sheets: string[];
  /** `sheet_N = "<scope id>"` constants, in order. */
  scopes: string[];
  /**
   * Calls to runtime helpers and `vars_N` outside JSX attribute values, in
   * order, each with the path of its enclosing functions (`<module>` at the
   * top level).
   */
  calls: string[];
  /** Per JSX opening element: its own attributes, then the added ones. */
  elements: string[];
}

type Node = Record<string, any>;

interface Collector {
  artifacts: Artifacts;
  /** Local name of each `solid-styled` import, mapped to its imported name. */
  aliases: Map<string, string>;
}

function parseOutput(code: string): Node {
  const result = parseSync('output.tsx', code, {
    lang: 'tsx',
    sourceType: 'module',
    preserveParens: false,
  });
  if (result.errors.length > 0) {
    throw new Error(`output does not parse: ${result.errors[0].message}`);
  }
  return result.program;
}

/** Collects the import aliases: `_useSolidStyled` and `useSolidStyled_1` both map to `useSolidStyled`. */
function collectAliases(program: Node): Map<string, string> {
  const aliases = new Map<string, string>();
  for (const statement of program.body) {
    if (statement.type !== 'ImportDeclaration' || statement.source.value !== 'solid-styled') {
      continue;
    }
    for (const specifier of statement.specifiers) {
      if (specifier.type === 'ImportSpecifier' && specifier.imported.type === 'Identifier') {
        aliases.set(specifier.local.name, specifier.imported.name);
      }
    }
  }
  return aliases;
}

function renderName(name: string, aliases: Map<string, string>): string {
  // Intended difference: 1.0 names its helper imports `_useSolidStyled`,
  // 0.12.1 names them `useSolidStyled_1`. Both resolve to the same import.
  return aliases.get(name) ?? name;
}

function renderKey(node: Node, aliases: Map<string, string>): string {
  if (node.type === 'Identifier') {
    return node.name;
  }
  return renderNode(node, aliases);
}

/** Prints an expression in one fixed format, so both outputs print alike. */
function renderNode(node: Node | null, aliases: Map<string, string>): string {
  if (node === null) {
    return 'null';
  }
  switch (node.type) {
    case 'Identifier':
      return renderName(node.name, aliases);
    case 'Literal':
      return JSON.stringify(node.value);
    case 'MemberExpression':
      return node.computed
        ? `${renderNode(node.object, aliases)}[${renderNode(node.property, aliases)}]`
        : `${renderNode(node.object, aliases)}.${node.property.name}`;
    case 'CallExpression': {
      const args: string[] = [];
      for (const argument of node.arguments) {
        args.push(renderNode(argument, aliases));
      }
      return `${renderNode(node.callee, aliases)}(${args.join(', ')})`;
    }
    case 'ArrowFunctionExpression': {
      const params: string[] = [];
      for (const param of node.params) {
        params.push(renderNode(param, aliases));
      }
      return `(${params.join(', ')}) => ${renderNode(node.body, aliases)}`;
    }
    case 'ObjectExpression': {
      const properties: string[] = [];
      for (const property of node.properties) {
        if (property.type !== 'Property') {
          properties.push(`...${renderNode(property.argument, aliases)}`);
          continue;
        }
        properties.push(
          `${renderKey(property.key, aliases)}: ${renderNode(property.value, aliases)}`,
        );
      }
      return `({ ${properties.join(', ')} })`;
    }
    case 'SequenceExpression': {
      const parts: string[] = [];
      for (const expression of node.expressions) {
        parts.push(renderNode(expression, aliases));
      }
      return `(${parts.join(', ')})`;
    }
    case 'JSXExpressionContainer':
      return `{${renderNode(node.expression, aliases)}}`;
    default:
      // A node the compilers do not emit in a runtime call. Fail loudly so the
      // normalization grows with the compiler instead of hiding a change.
      throw new Error(`cannot render ${node.type}`);
  }
}

function renderAttributeName(name: Node): string {
  if (name.type === 'JSXNamespacedName') {
    return `${name.namespace.name}:${name.name.name}`;
  }
  return name.name;
}

/** True for `s:*` and for any `style`, the user's own included. */
function isAddedAttribute(attribute: Node): boolean {
  if (attribute.type !== 'JSXAttribute') {
    return false;
  }
  const name = attribute.name;
  return (
    (name.type === 'JSXNamespacedName' && name.namespace.name === 's') ||
    (name.type === 'JSXIdentifier' && name.name === 'style')
  );
}

function renderAttribute(attribute: Node, aliases: Map<string, string>): string {
  if (attribute.type === 'JSXSpreadAttribute') {
    return `{...${renderNode(attribute.argument, aliases)}}`;
  }
  const name = renderAttributeName(attribute.name);
  if (attribute.value === null) {
    return name;
  }
  return `${name}=${renderNode(attribute.value, aliases)}`;
}

function renderElementName(name: Node): string {
  if (name.type === 'JSXMemberExpression') {
    return `${renderElementName(name.object)}.${name.property.name}`;
  }
  return renderAttributeName(name);
}

/**
 * Records a JSX opening element. Intended difference: 1.0 inserts `s:<scope>`
 * and `style` right after the element name, 0.12.1 appends them after the
 * other attributes, and an existing `style` keeps its place. Between
 * attributes with different names the position has no runtime effect, so the
 * record keeps the element's own attributes in order and sorts the added ones
 * (`s:*` and `style`). A spread attribute is the exception: it can hold a
 * `style` of its own, so each added attribute keeps the number of spreads
 * before it, and the sort only reorders attributes between the same spreads.
 */
function recordElement(node: Node, collector: Collector): void {
  const own: string[] = [];
  const added: string[] = [];
  let spreads = 0;
  for (const attribute of node.attributes) {
    const rendered = renderAttribute(attribute, collector.aliases);
    if (isAddedAttribute(attribute)) {
      added.push(`${spreads}:${rendered}`);
    } else {
      own.push(rendered);
    }
    if (attribute.type === 'JSXSpreadAttribute') {
      spreads += 1;
    }
  }
  added.sort();
  collector.artifacts.elements.push(
    `<${renderElementName(node.name)} ${own.join(' ')} | ${added.join(' ')}>`,
  );
}

function recordDeclarator(node: Node, collector: Collector): void {
  if (node.id.type !== 'Identifier' || node.init?.type !== 'Literal') {
    return;
  }
  const name: string = node.id.name;
  if (SHEET_ID.test(name)) {
    collector.artifacts.scopes.push(`${name} = ${node.init.value}`);
  } else if (CSS_ID.test(name)) {
    collector.artifacts.sheets.push(`${name} = ${node.init.value}`);
  }
}

function recordTemplate(node: Node, collector: Collector): void {
  const first = node.quasis[0]?.value.raw ?? '';
  const marker = MARKER.exec(first);
  if (marker) {
    // The marker is still in the output, so the template was left alone.
    collector.artifacts.compiled[marker[0]] = false;
  }
}

function isRuntimeCall(node: Node, aliases: Map<string, string>): boolean {
  if (node.callee.type !== 'Identifier') {
    return false;
  }
  const name: string = node.callee.name;
  return VARS_ID.test(name) || RUNTIME_HELPERS.has(aliases.get(name) ?? '');
}

/** Where the walk is: the enclosing functions, and whether it is in an attribute value. */
interface Place {
  scope: string;
  inAttribute: boolean;
  /** The declared name for a function that is the `init` of a declarator. */
  hint: string | null;
}

const FUNCTION_TYPES = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
]);

function enterFunction(record: Node, place: Place): string {
  const name: string = record.id?.name ?? place.hint ?? '<anonymous>';
  return place.scope === '<module>' ? name : `${place.scope} > ${name}`;
}

/** Computes the place of one child of `record`, found under `key`. */
function placeChild(record: Node, key: string, place: Place): Place {
  const scope = FUNCTION_TYPES.has(record.type) ? enterFunction(record, place) : place.scope;
  // `elements` already prints every attribute value, calls included.
  const inAttribute =
    place.inAttribute ||
    (record.type === 'JSXAttribute' && key === 'value') ||
    (record.type === 'JSXSpreadAttribute' && key === 'argument');
  const hint =
    record.type === 'VariableDeclarator' && key === 'init' && record.id.type === 'Identifier'
      ? (record.id.name as string)
      : null;
  return { scope, inAttribute, hint };
}

/** Walks the tree and records every artifact. JSX attributes are recorded per element. */
function walk(node: unknown, collector: Collector, place: Place): void {
  if (node === null || typeof node !== 'object') {
    return;
  }
  if (Array.isArray(node)) {
    for (const child of node) {
      walk(child, collector, place);
    }
    return;
  }
  const record = node as Node;
  switch (record.type) {
    case 'JSXOpeningElement':
      recordElement(record, collector);
      break;
    case 'VariableDeclarator':
      recordDeclarator(record, collector);
      break;
    case 'TemplateLiteral':
      recordTemplate(record, collector);
      break;
    case 'CallExpression':
      if (!place.inAttribute && isRuntimeCall(record, collector.aliases)) {
        collector.artifacts.calls.push(`${place.scope}: ${renderNode(record, collector.aliases)}`);
      }
      break;
  }
  for (const key in record) {
    if (key !== 'parent') {
      walk(record[key], collector, placeChild(record, key, place));
    }
  }
}

/**
 * Parses compiler output and extracts the artifacts both compilers must agree
 * on. `markers` lists every template marker of the input; a marker missing
 * from the output means its template was compiled.
 */
function extractArtifacts(code: string, markers: readonly string[]): Artifacts {
  const program = parseOutput(code);
  const collector: Collector = {
    artifacts: { compiled: {}, sheets: [], scopes: [], calls: [], elements: [] },
    aliases: collectAliases(program),
  };
  for (const marker of markers) {
    collector.artifacts.compiled[marker] = true;
  }
  walk(program, collector, { scope: '<module>', inAttribute: false, hint: null });
  return collector.artifacts;
}

/** Rewrites both unit forms into one in every sheet. */
function normalizeUnits(artifacts: Artifacts, pattern: RegExp): Artifacts {
  const sheets: string[] = [];
  for (const sheet of artifacts.sheets) {
    sheets.push(
      sheet.replace(pattern, '<unit $1 $2>').replace(UNIT_DECLARATION, dropTokenEndSpaces),
    );
  }
  return { ...artifacts, sheets };
}

function listMarkers(module: GeneratedModule): string[] {
  const markers: string[] = [];
  for (const template of module.templates) {
    markers.push(template.marker);
  }
  return markers;
}

function stripQuery(id: string): string {
  return id.split('?')[0];
}

type Outcome = { ok: true; code: string } | { ok: false; error: unknown };

function compileCurrent(id: string, code: string, options: SolidStyledOptions): Outcome {
  try {
    return { ok: true, code: compile(id, code, options).code };
  } catch (error) {
    return { ok: false, error };
  }
}

async function compileOld(id: string, code: string, options: SolidStyledOptions): Promise<Outcome> {
  try {
    // Intended difference: 1.0 hashes the file path without its query string,
    // 0.12.1 hashes the whole id. Give 0.12.1 the path without the query so
    // both derive the same scope hash; the query still reaches 1.0.
    return { ok: true, code: (await compileLegacy(stripQuery(id), code, options)).code };
  } catch (error) {
    return { ok: false, error };
  }
}

const FILE_IDS = [
  'src/index.tsx',
  'src/components/Button.tsx',
  'src/index.tsx?v=1',
  '/abs/path/App.tsx?macro=true&lang.tsx',
];

const options: fc.Arbitrary<SolidStyledOptions> = fc.record(
  {
    verbose: fc.boolean(),
    prefix: fc.constantFrom('a', 'my-app', 'x1'),
    browserslist: fc.constantFrom('chrome 60', 'safari 10', 'firefox 100', 'defaults'),
  },
  { requiredKeys: ['verbose'] },
);

/** Compiles with both compilers and expects the same normalized artifacts. */
async function expectSameOutput(
  id: string,
  code: string,
  markers: readonly string[],
  opts: SolidStyledOptions,
): Promise<void> {
  const current = compileCurrent(id, code, opts);
  const old = await compileOld(id, code, opts);
  // Intended difference: 1.0 throws `CompileError`, 0.12.1 throws Babel or
  // lightningcss errors. Only whether both throw counts.
  expect(current.ok, 'only one compiler threw').toBe(old.ok);
  if (!current.ok || !old.ok) {
    return;
  }
  const expected = normalizeUnits(extractArtifacts(old.code, markers), UNIT_SPACED);
  const actual = normalizeUnits(extractArtifacts(current.code, markers), UNIT_CALC);
  expect(actual).toEqual(expected);
}

const FILE = 'src/index.tsx';

describe('oracle: solid-styled 0.12.1', () => {
  it(
    'produces the same sheets, scope ids, runtime calls and attributes',
    async () => {
      // Babel rejects the module-level `var` that redeclares the import.
      const modules = component({ modulePoison: false });
      await fc.assert(
        fc.asyncProperty(modules, fc.constantFrom(...FILE_IDS), options, async (module, id, opts) =>
          expectSameOutput(id, module.code, listMarkers(module), opts),
        ),
        { seed: SEED, numRuns: RUNS },
      );
    },
    TIMEOUT,
  );

  // The generated modules only use `class="root"`. These cover the `style`
  // forms that both compilers merge with the CSS variables.
  it.each([
    ['a string', '<a style="color: red" />'],
    ['an object', '<a style={{ color: "red" }} id="x" />'],
    ['an expression', '<a style={props.style} />'],
    ['no value', '<a style />'],
    ['an empty expression', '<a style={} />'],
  ])('merges an existing style given as %s', async (_, element) => {
    const code = `import { css } from 'solid-styled';\nexport function C(props: any) {\ncss\`/*t1*/a { color: \${props.c}; }\`;\nreturn <div>${element}</div>;\n}\n`;
    await expectSameOutput(FILE, code, ['/*t1*/'], {});
  });

  // An element in a nested function gets the scope and the CSS variables of
  // every enclosing function that calls `css`, outermost first. The
  // generators only put elements in the component body.
  it('scopes an element in a nested function with both sheets', async () => {
    const code = `import { css } from 'solid-styled';
export function C(props: any) {
  css\`/*t1*/a { color: \${props.c}; }\`;
  function Inner() {
    css\`/*t2*/b { margin: 0 \${props.m}px; }\`;
    return <a style={props.s} id="x" />;
  }
  return <div>{Inner()}<b /></div>;
}
`;
    await expectSameOutput(FILE, code, ['/*t1*/', '/*t2*/'], {});
  });

  // Intended difference, outside what the generators produce. With a spread,
  // 0.12.1 appends `s:<scope>` and `style={vars_1()}` after it, so the CSS
  // variables replace `props.style`. 1.0 also places them after the spread
  // but merges the spread's style with the variables (#71), so both survive.
  // The oracle cannot compare this case, so it checks the 1.0 output alone.
  it('merges a spread style with the CSS variables', () => {
    const code = `import { css } from 'solid-styled';\nexport function C(props: any) {\ncss\`/*t1*/a { color: \${props.c}; }\`;\nreturn <a {...props} />;\n}\n`;
    const output = compile(FILE, code).code;
    expect(output).toMatch(
      /<a \{\.\.\.props\} s:[\w-]+ style=\{_mergeStyles\(props\?\.style, vars_1\(\)\)\} \/>/,
    );
  });
});
