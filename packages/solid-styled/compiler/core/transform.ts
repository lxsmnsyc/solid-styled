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

/** `<style jsx>` — setup calls hoisted before the enclosing statement. */
function transformStyleTask(ctx: Ctx, task: StyleTask): void {
  const sheet = getSheet(ctx, task.fn, task.root);
  const indent = indentAt(ctx.code, task.statement.start);

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
    ctx.s.appendLeft(task.statement.start, `${call};\n${indent}`);
  }

  ctx.s.remove(task.element.start, task.element.end);
}

function getStyleAttribute(opening: Node): Node | null {
  for (const attr of opening.attributes) {
    if (
      attr.type === 'JSXAttribute' &&
      attr.name.type === 'JSXIdentifier' &&
      attr.name.name === 'style'
    ) {
      return attr;
    }
  }
  return null;
}

/** Folds every applicable `vars_N()` into the element's `style` prop. */
function applyStyle(ctx: Ctx, opening: Node, varsList: string[]): void {
  const merge = ctx.importIdent(RUNTIME_IDENTIFIERS.mergeStyles);

  function nest(base: string | null): string {
    let expression = base;
    for (const vars of varsList) {
      expression = expression === null ? `${vars}()` : `${merge}(${expression}, ${vars}())`;
    }
    return expression!;
  }

  const style = getStyleAttribute(opening);
  if (!style) {
    ctx.s.appendLeft(opening.name.end, ` style={${nest(null)}}`);
    return;
  }
  if (!style.value) {
    ctx.s.appendLeft(style.name.end, `={${nest(null)}}`);
    return;
  }
  const value = style.value;
  if (value.type === 'JSXExpressionContainer') {
    const expression = value.expression;
    if (expression.type === 'JSXEmptyExpression') {
      ctx.s.overwrite(value.start, value.end, `{${nest(null)}}`);
      return;
    }
    ctx.s.appendLeft(expression.start, `${merge}(`.repeat(varsList.length));
    ctx.s.appendRight(expression.end, varsList.map((vars) => `, ${vars}())`).join(''));
    return;
  }
  if (value.type === 'Literal') {
    ctx.s.overwrite(value.start, value.end, `{${nest(value.raw)}}`);
    return;
  }
  ctx.error(value, 'Invalid style value.');
}

/** Marks host elements (and `use:solid-styled` opt-ins) with their sheet scopes. */
function scopeElement(ctx: Ctx, record: ElementRecord): void {
  const opening = record.element.openingElement;
  const isHost = opening.name.type === 'JSXIdentifier' && HOST_ELEMENT.test(opening.name.name);
  if (!isHost && !record.hasUseAttribute) {
    return;
  }

  const varsList: string[] = [];
  // Outermost first, matching the order the sheets were declared in.
  for (const fn of record.functions) {
    const sheet = ctx.sheets.get(fn);
    if (!sheet || hasScopedAttribute(opening, sheet.scope)) {
      continue;
    }
    ctx.s.appendLeft(opening.name.end, ` ${SOLID_STYLED_NS}:${sheet.scope}`);
    const vars = ctx.vars.get(fn);
    if (vars) {
      varsList.push(vars);
    }
  }

  if (varsList.length > 0) {
    applyStyle(ctx, opening, varsList);
  }
}

const WHITESPACE = /\s/;

/** Drops the `use:solid-styled` marker along with the space in front of it. */
function removeUseAttribute(ctx: Ctx, attr: Node): void {
  let start = attr.start;
  while (start > 0 && WHITESPACE.test(ctx.code[start - 1])) {
    start--;
  }
  ctx.s.remove(start, attr.end);
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
    removeUseAttribute(ctx, attr);
  }
  ctx.finalize();
}
