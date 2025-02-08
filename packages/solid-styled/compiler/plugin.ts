import type * as babel from '@babel/core';
import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import {
  RUNTIME_IDENTIFIERS,
  SHEET_ID,
  SOLID_STYLED_NS,
  SOURCE_MODULE,
  VARS_ID,
} from './core/constants';
import { generateUniqueName } from './core/generate-unique-name';
import { getDescriptiveName } from './core/get-descriptive-name';
import { getImportIdentifier } from './core/get-import-identifier';
import getRootStatementPath from './core/get-root-statement-path';
import { pathReferencesImport } from './core/path-references-import';
import processCSSTemplate from './core/process-css-template';
import unwrapNode from './core/unwrap-node';
import { getPrefix, getUniqueId } from './core/utils';
import type { ScopedSheet, StateContext } from './types';

function isUseAttribute(name: t.JSXNamespacedName | t.JSXIdentifier): boolean {
  return (
    t.isJSXNamespacedName(name) &&
    name.namespace.name === 'use' &&
    name.name.name === 'solid-styled'
  );
}

function checkScopedAttribute(
  opening: t.JSXOpeningElement,
  sheetID: string,
): boolean {
  for (let i = 0, len = opening.attributes.length; i < len; i += 1) {
    const attr = opening.attributes[i];
    if (
      t.isJSXAttribute(attr) &&
      t.isJSXNamespacedName(attr.name) &&
      attr.name.namespace.name === SOLID_STYLED_NS &&
      attr.name.name.name === sheetID
    ) {
      return true;
    }
  }
  return false;
}

function checkUseAttribute(opening: t.JSXOpeningElement): boolean {
  for (let i = 0, len = opening.attributes.length; i < len; i += 1) {
    const attr = opening.attributes[i];
    if (t.isJSXAttribute(attr) && isUseAttribute(attr.name)) {
      return true;
    }
  }
  return false;
}

function generateVars(
  ctx: StateContext,
  path: NodePath,
  functionParent: NodePath,
): t.Identifier {
  const result = ctx.vars.get(functionParent);
  if (result) {
    return result;
  }
  const vars = generateUniqueName(path, VARS_ID);
  functionParent.scope.push({
    id: vars,
    init: t.callExpression(
      getImportIdentifier(
        ctx,
        path,
        SOURCE_MODULE,
        RUNTIME_IDENTIFIERS.createCSSVars,
      ),
      [],
    ),
    kind: 'const',
  });
  ctx.vars.set(functionParent, vars);
  return vars;
}

function generateSheet(
  ctx: StateContext,
  functionParent: NodePath,
): ScopedSheet {
  const result = ctx.sheets.get(functionParent);
  if (result) {
    return result;
  }
  // Generate an id
  const baseID = getUniqueId(ctx);
  const verboseId = ctx.opts.verbose
    ? `${getDescriptiveName(functionParent, 'Anonymous')}-${baseID}`
    : baseID;
  // Finalize ID generation
  const scope = `${getPrefix(ctx)}${verboseId}`;

  // Create a unique identifier for the scope
  const root = getRootStatementPath(functionParent);
  const id = generateUniqueName(root, SHEET_ID);
  root.insertBefore(
    t.variableDeclaration('const', [
      t.variableDeclarator(id, t.stringLiteral(scope)),
    ]),
  );
  const value: ScopedSheet = {
    id,
    scope,
    count: 0,
  };
  ctx.sheets.set(functionParent, value);
  return value;
}

function getStyleAttribute(
  opening: t.JSXOpeningElement,
): t.JSXAttribute | null {
  for (let i = 0, len = opening.attributes.length; i < len; i += 1) {
    const attr = opening.attributes[i];
    if (
      t.isJSXAttribute(attr) &&
      t.isJSXIdentifier(attr.name) &&
      attr.name.name === 'style'
    ) {
      return attr;
    }
  }
  return null;
}

function transformJSX(ctx: StateContext, functionParent: NodePath): void {
  const sheet = ctx.sheets.get(functionParent);
  if (!sheet) {
    return;
  }
  const vars = ctx.vars.get(functionParent);
  functionParent.traverse({
    JSXElement(path) {
      const opening = path.node.openingElement;
      if (
        (t.isJSXIdentifier(opening.name) && /^[a-z]/.test(opening.name.name)) ||
        checkUseAttribute(opening)
      ) {
        if (checkScopedAttribute(opening, sheet.scope)) {
          return;
        }
        opening.attributes.push(
          t.jsxAttribute(
            t.jsxNamespacedName(
              t.jsxIdentifier(SOLID_STYLED_NS),
              t.jsxIdentifier(sheet.scope),
            ),
          ),
        );
        // Check if there's any dynamic vars call
        if (!vars) {
          return;
        }
        // Find style
        const style = getStyleAttribute(opening);
        if (style) {
          if (style.value) {
            let expr: t.Expression;
            if (
              t.isJSXExpressionContainer(style.value) &&
              t.isExpression(style.value.expression)
            ) {
              expr = style.value.expression;
            } else if (t.isStringLiteral(style.value)) {
              expr = style.value;
            } else {
              throw new Error('Invalid style value');
            }
            style.value = t.jsxExpressionContainer(
              t.callExpression(
                getImportIdentifier(
                  ctx,
                  path,
                  SOURCE_MODULE,
                  RUNTIME_IDENTIFIERS.mergeStyles,
                ),
                [expr, t.callExpression(vars, [])],
              ),
            );
          } else {
            style.value = t.jsxExpressionContainer(t.callExpression(vars, []));
          }
        } else {
          opening.attributes.push(
            t.jsxAttribute(
              t.jsxIdentifier('style'),
              t.jsxExpressionContainer(t.callExpression(vars, [])),
            ),
          );
        }
      }
    },
  });
}

function processTemplateInJSX(
  ctx: StateContext,
  path: NodePath<t.JSXElement>,
  sheet: ScopedSheet,
  isGlobal: boolean,
  parent: {
    root: NodePath;
    statement: NodePath;
    function: NodePath;
  },
  expression: t.Expression,
): void {
  const tmpl = unwrapNode(expression, t.isTemplateLiteral);
  if (!tmpl) {
    return;
  }
  const { sheet: compiledSheet, variables } = processCSSTemplate(
    ctx,
    sheet.scope,
    tmpl,
    !isGlobal,
  );

  const cssID = generateUniqueName(parent.root, 'css');

  parent.root.insertBefore(
    t.variableDeclaration('const', [
      t.variableDeclarator(cssID, t.stringLiteral(compiledSheet)),
    ]),
  );

  const current = sheet.count + 1;
  sheet.count = current;

  const computedVars = variables.length
    ? t.arrowFunctionExpression([], t.objectExpression(variables))
    : undefined;
  if (isGlobal) {
    const args: t.Expression[] = [sheet.id, t.numericLiteral(current), cssID];
    if (computedVars) {
      args.push(computedVars);
    }
    parent.statement.insertBefore(
      t.expressionStatement(
        t.callExpression(
          getImportIdentifier(
            ctx,
            path,
            SOURCE_MODULE,
            RUNTIME_IDENTIFIERS.useSolidStyledGlobal,
          ),
          args,
        ),
      ),
    );
  } else {
    const setup = t.callExpression(
      getImportIdentifier(
        ctx,
        path,
        SOURCE_MODULE,
        RUNTIME_IDENTIFIERS.useSolidStyled,
      ),
      [sheet.id, t.numericLiteral(current), cssID],
    );
    parent.statement.insertBefore(
      t.expressionStatement(
        computedVars
          ? t.sequenceExpression([
              setup,
              t.callExpression(generateVars(ctx, path, parent.function), [
                computedVars,
              ]),
            ])
          : setup,
      ),
    );
  }
}

function getStyleJSXMode(
  attributes: (t.JSXAttribute | t.JSXSpreadAttribute)[],
): {
  isJSX: boolean;
  isGlobal: boolean;
} {
  let isGlobal = false;
  let isJSX = false;
  for (let i = 0, len = attributes.length; i < len; i += 1) {
    const attr = attributes[i];
    if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name)) {
      if (attr.name.name === 'jsx') {
        isJSX = true;
      }
      if (attr.name.name === 'global') {
        isGlobal = true;
      }
    }
  }

  return { isJSX, isGlobal };
}

function processJSXTemplate(
  ctx: StateContext,
  path: NodePath<t.JSXElement>,
): void {
  const opening = path.node.openingElement;
  if (!t.isJSXIdentifier(opening.name)) {
    return;
  }
  if (opening.name.name !== 'style') {
    return;
  }
  const { isJSX, isGlobal } = getStyleJSXMode(opening.attributes);
  if (!isJSX) {
    return;
  }
  const scope = path.scope.getFunctionParent();
  if (!scope) {
    return;
  }
  const functionParent = scope.path;
  const sheet = generateSheet(ctx, functionParent);
  const statement = path.getStatementParent();
  if (statement) {
    const root = getRootStatementPath(path);
    for (let i = 0, len = path.node.children.length; i < len; i += 1) {
      const child = path.node.children[i];
      if (
        t.isJSXExpressionContainer(child) &&
        t.isExpression(child.expression)
      ) {
        processTemplateInJSX(
          ctx,
          path,
          sheet,
          isGlobal,
          {
            root,
            statement,
            function: functionParent,
          },
          child.expression,
        );
      }
    }
  }
  const empty = t.jsxText('');
  // softfix
  empty.extra = {
    raw: '',
  };
  path.replaceWith(empty);
}

function processCSSTaggedTemplate(
  ctx: StateContext,
  path: NodePath<t.TaggedTemplateExpression>,
): void {
  // Get the function parent first
  const scope = path.scope.getFunctionParent();
  if (!scope) {
    return;
  }
  const functionParent = scope.path;
  const sheet = generateSheet(ctx, functionParent);

  // Convert template into a CSS sheet
  const { sheet: compiledSheet, variables } = processCSSTemplate(
    ctx,
    sheet.scope,
    path.node.quasi,
    true,
  );

  const root = getRootStatementPath(path);

  const cssID = generateUniqueName(root, 'css');

  root.insertBefore(
    t.variableDeclaration('const', [
      t.variableDeclarator(cssID, t.stringLiteral(compiledSheet)),
    ]),
  );

  const current = sheet.count + 1;
  sheet.count = current;

  const computedVars = variables.length
    ? t.arrowFunctionExpression([], t.objectExpression(variables))
    : undefined;
  const setup = t.callExpression(
    getImportIdentifier(
      ctx,
      path,
      SOURCE_MODULE,
      RUNTIME_IDENTIFIERS.useSolidStyled,
    ),
    [sheet.id, t.numericLiteral(current), cssID],
  );

  path.replaceWith(
    t.expressionStatement(
      computedVars
        ? t.sequenceExpression([
            setup,
            t.callExpression(generateVars(ctx, path, functionParent), [
              computedVars,
            ]),
          ])
        : setup,
    ),
  );
}

type State = babel.PluginPass & { opts: StateContext };

export default function solidStyledPlugin(): babel.PluginObj<State> {
  return {
    name: 'solid-styled',
    visitor: {
      Program(programPath, state): void {
        // Process templates
        programPath.traverse({
          JSXElement(path) {
            processJSXTemplate(state.opts, path);
          },
          TaggedTemplateExpression(path) {
            if (!t.isStatement(path.parent)) {
              return;
            }
            if (pathReferencesImport(path.get('tag'), 'solid-styled', 'css')) {
              processCSSTaggedTemplate(state.opts, path);
            }
          },
        });
        programPath.traverse({
          Function(path) {
            transformJSX(state.opts, path);
          },
          JSXAttribute(path) {
            if (isUseAttribute(path.node.name)) {
              path.remove();
            }
          },
        });
        programPath.scope.crawl();
      },
    },
  };
}
