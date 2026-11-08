import { type CssTask, type ElementRecord, type StyleTask, hasScopedAttribute } from './analyze';
import { type Node, indentAt } from './ast';
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

/**
 * The statement a `<style jsx>` setup call goes before. A declaration that an
 * `export` wraps resolves to the export, so the call never lands between
 * `export` and the declaration.
 */
function getStyleAnchor(task: StyleTask): Node {
  const root = task.root;
  if (
    (root.type === 'ExportNamedDeclaration' || root.type === 'ExportDefaultDeclaration') &&
    root.declaration === task.statement
  ) {
    return root;
  }
  return task.statement;
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
