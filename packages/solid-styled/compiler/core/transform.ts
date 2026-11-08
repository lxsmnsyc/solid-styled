import { type CssTask, type ElementRecord, type StyleTask, hasScopedAttribute } from './analyze';
import { type Node, eachChild, indentAt } from './ast';
import { RUNTIME_IDENTIFIERS, SHEET_ID, SOLID_STYLED_NS, VARS_ID } from './constants';
import type { Ctx, ScopedSheet } from './context';
import processCSSTemplate, { type CSSVariable } from './process-css-template';

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

/**
 * Generated code as text pieces around source expressions. Emitting a node
 * keeps its original chunk, so the source map still points into it.
 */
type Part = string | Node;

/** `() => ({ "--id": expression, ... })`, or nothing without variables. */
function computedVarsParts(variables: CSSVariable[]): Part[] {
  if (variables.length === 0) {
    return [];
  }
  const parts: Part[] = ['() => ({ '];
  for (const [index, variable] of variables.entries()) {
    parts.push(`${index > 0 ? ', ' : ''}${JSON.stringify(variable.id)}: `, variable.expression);
  }
  parts.push(' })');
  return parts;
}

/** `(setup, vars_N(computed))`, or the bare setup call without variables. */
function setupParts(ctx: Ctx, fn: Node, setup: string, variables: CSSVariable[]): Part[] {
  if (variables.length === 0) {
    return [setup];
  }
  return [`(${setup}, ${getVars(ctx, fn)}(`, ...computedVarsParts(variables), '))'];
}

/**
 * Replaces `start..end` with the parts. Only the text between the parts'
 * nodes is overwritten, so the nodes keep their code and mappings.
 */
function replaceWithParts(ctx: Ctx, start: number, end: number, parts: Part[]): void {
  let cursor = start;
  let text = '';
  for (const part of parts) {
    if (typeof part === 'string') {
      text += part;
    } else {
      ctx.s.overwrite(cursor, part.start, text);
      cursor = part.end;
      text = '';
    }
  }
  ctx.s.overwrite(cursor, end, text);
}

/** Inserts text before `anchor`, after anything already hoisted there. */
function hoistText(ctx: Ctx, anchor: number, text: string): void {
  if (text === '') {
    return;
  }
  const last = ctx.hoisted.get(anchor);
  ctx.s.appendLeft(last ?? anchor, text);
}

/**
 * Hoists the parts before `anchor` in order. Nodes are moved rather than
 * copied, so they keep their code and mappings.
 */
function hoistParts(ctx: Ctx, anchor: number, parts: Part[]): void {
  let text = '';
  for (const part of parts) {
    if (typeof part === 'string') {
      text += part;
    } else {
      hoistText(ctx, anchor, text);
      text = '';
      ctx.s.move(part.start, part.end, anchor);
      ctx.hoisted.set(anchor, part.end);
    }
  }
  hoistText(ctx, anchor, text);
}

/** `css\`...\`` — replaced in place by the runtime setup call. */
function transformCssTask(ctx: Ctx, task: CssTask): void {
  const sheet = getSheet(ctx, task.fn, task.root);
  const { sheet: compiled, variables } = processCSSTemplate(ctx, sheet.scope, task.template, true);
  const cssID = ctx.unique('css');
  ctx.s.appendLeft(task.root.start, `const ${cssID} = ${JSON.stringify(compiled)};\n`);

  sheet.count += 1;
  const setup = `${ctx.importIdent(RUNTIME_IDENTIFIERS.useSolidStyled)}(${sheet.id}, ${sheet.count}, ${cssID})`;
  replaceWithParts(
    ctx,
    task.expression.start,
    task.expression.end,
    setupParts(ctx, task.fn, setup, variables),
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

  // The element goes away, except for the expressions moved into the calls.
  const kept: Node[] = [];
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
    let call: Part[];
    if (task.isGlobal) {
      const args = `${sheet.id}, ${sheet.count}, ${cssID}`;
      const computed = computedVarsParts(variables);
      call = [
        `${ctx.importIdent(RUNTIME_IDENTIFIERS.useSolidStyledGlobal)}(${args}`,
        ...(computed.length > 0 ? [', ', ...computed] : []),
        ')',
      ];
    } else {
      const setup = `${ctx.importIdent(RUNTIME_IDENTIFIERS.useSolidStyled)}(${sheet.id}, ${sheet.count}, ${cssID})`;
      call = setupParts(ctx, task.fn, setup, variables);
    }
    hoistParts(ctx, anchor.start, [...call, `;\n${indent}`]);
    for (const variable of variables) {
      kept.push(variable.expression);
    }
  }

  let cursor = task.element.start;
  for (const node of kept) {
    ctx.s.remove(cursor, node.start);
    cursor = node.end;
  }
  ctx.s.remove(cursor, task.element.end);
}

function isStyleAttribute(attr: Node): boolean {
  return (
    attr.type === 'JSXAttribute' && attr.name.type === 'JSXIdentifier' && attr.name.name === 'style'
  );
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
    wrapStyleValue(ctx, expression, varsList, '');
    return;
  }
  if (value.type === 'Literal') {
    wrapStyleValue(ctx, value, varsList, '{');
    return;
  }
  ctx.error(value, 'Invalid style value.');
}

/** Wraps a style value in `mergeStyles` calls by inserting text around it. */
function wrapStyleValue(ctx: Ctx, value: Node, varsList: string[], brace: '' | '{'): void {
  const merge = ctx.importIdent(RUNTIME_IDENTIFIERS.mergeStyles);
  let closing = '';
  for (const vars of varsList) {
    closing += `, ${vars}())`;
  }
  ctx.s.appendLeft(value.start, `${brace}${`${merge}(`.repeat(varsList.length)}`);
  ctx.s.appendRight(value.end, `${closing}${brace === '{' ? '}' : ''}`);
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

/**
 * Wraps a spread argument in place: `{...x}` becomes
 * `{..._spreadStyle(x, vars_1)}`. Text only goes around the argument, so
 * nested edits, `await`, and source maps inside it keep working.
 */
function wrapSpread(ctx: Ctx, spread: Node, varsList: string[]): void {
  const helper = ctx.importIdent(RUNTIME_IDENTIFIERS.spreadStyle);
  // `a, b` is the only expression that is not a valid call argument.
  const isSequence = spread.argument.type === 'SequenceExpression';
  ctx.s.appendLeft(spread.argument.start, `${helper}(${isSequence ? '(' : ''}`);
  ctx.s.prependRight(spread.argument.end, `${isSequence ? ')' : ''}, ${varsList.join(', ')})`);
}

/**
 * Merges `vars_N()` into the style Solid resolves for an element with
 * spreads, where the last source with a `style` key wins. The last explicit
 * `style` merges in place; without one, `style={vars_1()}` goes after the
 * element name. Each spread after it is wrapped by `spreadStyle`, which
 * merges the variables into the spread's `style` when it has that key.
 */
function mergeSpreadStyles(
  ctx: Ctx,
  record: ElementRecord,
  lastStyle: number,
  varsList: string[],
): void {
  const opening = record.element.openingElement;
  const attributes = opening.attributes;
  if (lastStyle >= 0) {
    mergeStyleAttribute(ctx, attributes[lastStyle], varsList);
  } else {
    ctx.s.appendLeft(opening.name.end, ` style={${nestStyles(ctx, null, varsList)}}`);
  }
  for (const attr of attributes.slice(lastStyle + 1)) {
    if (attr.type === 'JSXSpreadAttribute') {
      wrapSpread(ctx, attr, varsList);
    }
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
    mergeSpreadStyles(ctx, record, lastStyle, varsList);
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
