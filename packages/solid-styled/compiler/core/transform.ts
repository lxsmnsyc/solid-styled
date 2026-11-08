import { type CssTask, type ElementRecord, type StyleTask, hasScopedAttribute } from './analyze';
import { type Node, eachChild, indentAt, textOf } from './ast';
import { RUNTIME_IDENTIFIERS, SHEET_ID, SOLID_STYLED_NS, VARS_ID } from './constants';
import type { Ctx, ScopedSheet } from './context';
import processCSSTemplate from './process-css-template';

const HOST_ELEMENT = /^[a-z]/;

/**
 * Best-effort human name for a function, used by `verbose` scopes: the nearest
 * enclosing function name, variable name, or method key.
 */
function descriptiveName(ctx: Ctx, fn: Node): string {
  const ancestors = ctx.analysis.ancestorsOf.get(fn) ?? [];
  const chain = [fn, ...ancestors.slice().reverse()];
  for (const node of chain) {
    switch (node.type) {
      case 'FunctionDeclaration':
      case 'FunctionExpression':
        if (node.id) {
          return node.id.name;
        }
        break;
      case 'VariableDeclarator':
        if (node.id.type === 'Identifier') {
          return node.id.name;
        }
        break;
      case 'MethodDefinition':
      case 'PropertyDefinition':
      case 'Property':
        if (node.key.type === 'Identifier') {
          return node.key.name;
        }
        if (node.key.type === 'PrivateIdentifier') {
          return node.key.name;
        }
        break;
      default:
        break;
    }
  }
  return 'Anonymous';
}

/**
 * Returns the function's scoped sheet, emitting `const sheet_N = "<scope>"`
 * before the enclosing top-level statement on first use.
 */
function getSheet(ctx: Ctx, fn: Node, root: Node): ScopedSheet {
  const existing = ctx.sheets.get(fn);
  if (existing) {
    return existing;
  }
  const baseID = ctx.uniqueId();
  const verboseID = ctx.opts.verbose ? `${descriptiveName(ctx, fn)}-${baseID}` : baseID;
  const scope = `${ctx.prefix()}${verboseID}`;
  const id = ctx.unique(SHEET_ID);
  ctx.s.appendLeft(root.start, `const ${id} = ${JSON.stringify(scope)};\n`);
  const sheet: ScopedSheet = { id, scope, count: 0 };
  ctx.sheets.set(fn, sheet);
  return sheet;
}

/**
 * Returns the function's CSS variable holder, declaring
 * `const vars_N = createCSSVars()` at the top of its body on first use.
 */
function getVars(ctx: Ctx, fn: Node): string {
  const existing = ctx.vars.get(fn);
  if (existing) {
    return existing;
  }
  const body = fn.body;
  if (body.type !== 'BlockStatement') {
    ctx.error(
      fn,
      'solid-styled needs a block body to hold the stylesheet variables of this component.',
    );
  }
  const name = ctx.unique(VARS_ID);
  const indent = indentAt(ctx.code, fn.start);
  const create = ctx.importIdent(RUNTIME_IDENTIFIERS.createCSSVars);
  ctx.s.appendLeft(body.start + 1, `\n${indent}  const ${name} = ${create}();`);
  ctx.vars.set(fn, name);
  return name;
}

function computedVarsOf(variables: string[]): string | null {
  return variables.length > 0 ? `() => ({ ${variables.join(', ')} })` : null;
}

/** `css\`...\`` — replaced in place by the runtime setup call. */
function transformCssTask(ctx: Ctx, task: CssTask): void {
  const sheet = getSheet(ctx, task.fn, task.root);
  const { sheet: compiled, variables } = processCSSTemplate(ctx, sheet.scope, task.template, true);
  const cssID = ctx.unique('css');
  ctx.s.appendLeft(task.root.start, `const ${cssID} = ${JSON.stringify(compiled)};\n`);

  sheet.count += 1;
  const setup = `${ctx.importIdent(RUNTIME_IDENTIFIERS.useSolidStyled)}(${sheet.id}, ${sheet.count}, ${cssID})`;
  const computed = computedVarsOf(variables);
  ctx.s.overwrite(
    task.expression.start,
    task.expression.end,
    computed ? `(${setup}, ${getVars(ctx, task.fn)}(${computed}))` : setup,
  );
}

/** Finds the nodes from `from` down to `target`, or null when `target` is not below it. */
function pathTo(from: Node, target: Node): Node[] | null {
  if (from === target) {
    return [from];
  }
  // Nothing outside a node's range can hold the target.
  if (target.start < from.start || target.end > from.end) {
    return null;
  }
  let found: Node[] | null = null;
  eachChild(from, (child) => {
    if (found) {
      return;
    }
    const rest = pathTo(child, target);
    if (rest) {
      found = [from, ...rest];
    }
  });
  return found;
}

/** True when `child` is the nested statement of a control statement `parent`. */
function isNestedBody(parent: Node, child: Node): boolean {
  switch (parent.type) {
    case 'IfStatement':
      return parent.consequent === child || parent.alternate === child;
    case 'ForStatement':
    case 'ForInStatement':
    case 'ForOfStatement':
    case 'WhileStatement':
    case 'DoWhileStatement':
    case 'LabeledStatement':
    case 'WithStatement':
      return parent.body === child;
    default:
      return false;
  }
}

/**
 * The statement a `<style jsx>` setup call goes before. A hook runs once per
 * render, so the call goes before the outermost control statement whose
 * unbraced body holds the nearest statement. A declaration that an `export`
 * wraps resolves to the export, so the call never lands between `export` and
 * the declaration.
 */
function getStyleAnchor(task: StyleTask): Node {
  const root = task.root;
  if (
    (root.type === 'ExportNamedDeclaration' || root.type === 'ExportDefaultDeclaration') &&
    root.declaration === task.statement
  ) {
    return root;
  }
  const path = pathTo(task.fn, task.statement);
  if (!path) {
    return task.statement;
  }
  // Climb while the statement is the unbraced body of a control statement.
  let index = path.length - 1;
  while (index > 0 && isNestedBody(path[index - 1], path[index])) {
    index -= 1;
  }
  return path[index];
}

/** `<style jsx>` — setup calls hoisted before the enclosing statement. */
function transformStyleTask(ctx: Ctx, task: StyleTask): void {
  const sheet = getSheet(ctx, task.fn, task.root);
  const anchor = getStyleAnchor(task);
  const indent = indentAt(ctx.code, anchor.start);

  for (const template of task.templates) {
    const { sheet: compiled, variables } = processCSSTemplate(
      ctx,
      sheet.scope,
      template,
      !task.isGlobal,
    );
    const cssID = ctx.unique('css');
    ctx.s.appendLeft(task.root.start, `const ${cssID} = ${JSON.stringify(compiled)};\n`);

    sheet.count += 1;
    const computed = computedVarsOf(variables);
    let call: string;
    if (task.isGlobal) {
      const args = [sheet.id, String(sheet.count), cssID];
      if (computed) {
        args.push(computed);
      }
      call = `${ctx.importIdent(RUNTIME_IDENTIFIERS.useSolidStyledGlobal)}(${args.join(', ')})`;
    } else {
      const setup = `${ctx.importIdent(RUNTIME_IDENTIFIERS.useSolidStyled)}(${sheet.id}, ${sheet.count}, ${cssID})`;
      call = computed ? `(${setup}, ${getVars(ctx, task.fn)}(${computed}))` : setup;
    }
    ctx.s.appendLeft(anchor.start, `${call};\n${indent}`);
  }

  ctx.s.remove(task.element.start, task.element.end);
}

function isStyleAttribute(attr: Node): boolean {
  return (
    attr.type === 'JSXAttribute' && attr.name.type === 'JSXIdentifier' && attr.name.name === 'style'
  );
}

/**
 * True when the expression can be read again without running anything new:
 * `props`, `this.props`, `props.rest`, `props["rest"]`. Getters may run again;
 * calls never do.
 */
function isReadableAgain(node: Node): boolean {
  if (node.type === 'Identifier' || node.type === 'ThisExpression') {
    return true;
  }
  if (node.type === 'MemberExpression' && !node.optional) {
    if (node.computed && node.property.type !== 'Literal') {
      return false;
    }
    return isReadableAgain(node.object);
  }
  return false;
}

/** Wraps a base style in one `mergeStyles` call per sheet. */
function nestStyles(ctx: Ctx, base: string | null, varsList: string[]): string {
  let expression = base;
  for (const vars of varsList) {
    expression =
      expression === null
        ? `${vars}()`
        : `${ctx.importIdent(RUNTIME_IDENTIFIERS.mergeStyles)}(${expression}, ${vars}())`;
  }
  return expression!;
}

/** Folds every applicable `vars_N()` into an explicit `style` attribute, in place. */
function mergeStyleAttribute(ctx: Ctx, style: Node, varsList: string[]): void {
  if (!style.value) {
    ctx.s.appendLeft(style.name.end, `={${nestStyles(ctx, null, varsList)}}`);
    return;
  }
  const value = style.value;
  if (value.type === 'JSXExpressionContainer') {
    const expression = value.expression;
    if (expression.type === 'JSXEmptyExpression') {
      ctx.s.overwrite(value.start, value.end, `{${nestStyles(ctx, null, varsList)}}`);
      return;
    }
    const merge = ctx.importIdent(RUNTIME_IDENTIFIERS.mergeStyles);
    let closing = '';
    for (const vars of varsList) {
      closing += `, ${vars}())`;
    }
    ctx.s.appendLeft(expression.start, `${merge}(`.repeat(varsList.length));
    ctx.s.appendRight(expression.end, closing);
    return;
  }
  if (value.type === 'Literal') {
    ctx.s.overwrite(value.start, value.end, `{${nestStyles(ctx, value.raw, varsList)}}`);
    return;
  }
  ctx.error(value, 'Invalid style value.');
}

/** Source text of an explicit `style` value, or null when it sets nothing. */
function readStyleValue(ctx: Ctx, style: Node): string | null {
  const value = style.value;
  if (!value) {
    return null;
  }
  if (value.type === 'JSXExpressionContainer') {
    if (value.expression.type === 'JSXEmptyExpression') {
      return null;
    }
    return textOf(ctx.code, value.expression);
  }
  if (value.type === 'Literal') {
    return value.raw;
  }
  return ctx.error(value, 'Invalid style value.');
}

const WHITESPACE = /\s/;

/** Drops an attribute along with the space in front of it. */
function removeAttribute(ctx: Ctx, attr: Node): void {
  let start = attr.start;
  while (start > 0 && WHITESPACE.test(ctx.code[start - 1])) {
    start--;
  }
  ctx.s.remove(start, attr.end);
}

interface SpreadBinding {
  name: string;
  source: string;
}

// A JSX child or attribute value needs braces around a plain expression.
const JSX_HOLDERS = new Set(['JSXElement', 'JSXFragment', 'JSXAttribute']);

/**
 * Binds each spread call to a parameter of an arrow function called in place:
 * `((_spread_1) => <a {..._spread_1()} />)(_trackSpread(() => getProps()))`.
 * `trackSpread` is a memo, so the call runs once per change, and both the
 * spread and the `style` that reads it stay reactive.
 */
function bindSpreads(ctx: Ctx, record: ElementRecord, bindings: SpreadBinding[]): void {
  const track = ctx.importIdent(RUNTIME_IDENTIFIERS.trackSpread);
  const names: string[] = [];
  const sources: string[] = [];
  for (const binding of bindings) {
    names.push(binding.name);
    sources.push(`${track}(() => ${binding.source})`);
  }
  const inJSX = record.parent !== undefined && JSX_HOLDERS.has(record.parent.type);
  const element = record.element;
  ctx.s.prependRight(element.start, `${inJSX ? '{' : ''}((${names.join(', ')}) => `);
  ctx.s.appendLeft(element.end, `)(${sources.join(', ')})${inJSX ? '}' : ''}`);
}

/**
 * Adds a `style` after the last spread. It merges `vars_N()` into the style
 * JSX would resolve without it: the last spread that has a `style` key, else
 * the source before it, down to the last explicit `style`. A nullish spread
 * is skipped, as Solid skips it.
 */
function addSpreadStyle(
  ctx: Ctx,
  record: ElementRecord,
  lastStyle: number,
  lastSpread: number,
  varsList: string[],
): void {
  const attributes = record.element.openingElement.attributes;
  let base: string | null = null;
  if (lastStyle >= 0) {
    // The explicit style moves into the fallback, so it is still evaluated once.
    base = readStyleValue(ctx, attributes[lastStyle]);
    removeAttribute(ctx, attributes[lastStyle]);
  }

  const bindings: SpreadBinding[] = [];
  for (let index = lastStyle + 1; index <= lastSpread; index++) {
    const attr = attributes[index];
    if (attr.type !== 'JSXSpreadAttribute') {
      continue;
    }
    let read = textOf(ctx.code, attr.argument);
    if (!isReadableAgain(attr.argument)) {
      const name = ctx.unique('_spread');
      bindings.push({ name, source: read });
      read = `${name}()`;
      ctx.s.overwrite(attr.argument.start, attr.argument.end, read);
    }
    // Solid skips a null or undefined spread, so the guards skip it too.
    base =
      base === null
        ? `${read}?.style`
        : `(${read} != null && "style" in ${read} ? ${read}.style : ${base})`;
  }

  ctx.s.appendLeft(attributes[lastSpread].end, ` style={${nestStyles(ctx, base, varsList)}}`);
  if (bindings.length > 0) {
    bindSpreads(ctx, record, bindings);
  }
}

/** Marks host elements (and `use:solid-styled` opt-ins) with their sheet scopes. */
function scopeElement(ctx: Ctx, record: ElementRecord): void {
  const opening = record.element.openingElement;
  const isHost = opening.name.type === 'JSXIdentifier' && HOST_ELEMENT.test(opening.name.name);
  if (!isHost && !record.hasUseAttribute) {
    return;
  }

  // Find the last spread and the last explicit `style`.
  let lastSpread = -1;
  let lastStyle = -1;
  for (const [index, attr] of opening.attributes.entries()) {
    if (attr.type === 'JSXSpreadAttribute') {
      lastSpread = index;
    } else if (isStyleAttribute(attr)) {
      lastStyle = index;
    }
  }
  // Added attributes go after the last spread, so a spread cannot replace them.
  const anchor = lastSpread >= 0 ? opening.attributes[lastSpread].end : opening.name.end;

  const varsList: string[] = [];
  // Outermost first, matching the order the sheets were declared in.
  for (const fn of record.functions) {
    const sheet = ctx.sheets.get(fn);
    if (!sheet || hasScopedAttribute(opening, sheet.scope)) {
      continue;
    }
    ctx.s.appendLeft(anchor, ` ${SOLID_STYLED_NS}:${sheet.scope}`);
    const vars = ctx.vars.get(fn);
    if (vars) {
      varsList.push(vars);
    }
  }

  if (varsList.length === 0) {
    return;
  }
  // Registered up front, as before, so the import header keeps its order.
  ctx.importIdent(RUNTIME_IDENTIFIERS.mergeStyles);
  if (lastStyle > lastSpread) {
    mergeStyleAttribute(ctx, opening.attributes[lastStyle], varsList);
  } else if (lastSpread >= 0) {
    addSpreadStyle(ctx, record, lastStyle, lastSpread, varsList);
  } else {
    ctx.s.appendLeft(anchor, ` style={${nestStyles(ctx, null, varsList)}}`);
  }
}

export default function transform(ctx: Ctx): void {
  for (const task of ctx.analysis.tasks) {
    if (task.kind === 'css') {
      transformCssTask(ctx, task);
    } else {
      transformStyleTask(ctx, task);
    }
  }
  for (const record of ctx.analysis.elements) {
    scopeElement(ctx, record);
  }
  for (const attr of ctx.analysis.useAttributes) {
    removeAttribute(ctx, attr);
  }
  ctx.finalize();
}
