import type { NodePath, Scope } from '@babel/traverse';
import type * as babel from '@babel/core';
import * as t from '@babel/types';
import type { ScopedSheet, StateContext } from './types';
import {
  RUNTIME_IDENTIFIERS,
  SHEET_ID,
  SOLID_STYLED_NS,
  SOURCE_MODULE,
  TAGGED_TEMPLATE,
  VARS_ID,
} from './core/constants';
import { getImportIdentifier } from './core/get-import-identifier';
import { getImportSpecifierKey } from './core/checks';
import processCSSTemplate from './core/process-css-template';
import { getUniqueId, getPrefix } from './core/utils';
import getRootStatementPath from './core/get-root-statement-path';
import { getDescriptiveName } from './core/get-descriptive-name';
import unwrapNode from './core/unwrap-node';

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
  functionParent: Scope,
): t.Identifier {
  const result = ctx.vars.get(functionParent);
  if (result) {
    return result;
  }
  const vars = functionParent.generateUidIdentifier(VARS_ID);
  functionParent.push({
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

function generateSheet(ctx: StateContext, functionParent: Scope): ScopedSheet {
  const result = ctx.sheets.get(functionParent);
  if (result) {
    return result;
  }
  // Generate an id
  const baseID = getUniqueId(ctx);
  const verboseId = ctx.opts.verbose
    ? `${getDescriptiveName(functionParent.path, 'Anonymous')}-${baseID}`
    : baseID;
  // Finalize ID generation
  const scope = `${getPrefix(ctx)}${verboseId}`;

  // Create a unique identifier for the scope
  const root = getRootStatementPath(functionParent.path);
  const id = root.scope.generateUidIdentifier(SHEET_ID);
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

function transformJSX(ctx: StateContext, functionParent: Scope): void {
  if (ctx.sheets.has(functionParent)) {
    functionParent.path.traverse({
      JSXElement(path) {
        const opening = path.node.openingElement;
        if (
          (t.isJSXIdentifier(opening.name) &&
            /^[a-z]/.test(opening.name.name)) ||
          checkUseAttribute(opening)
        ) {
          const sheet = generateSheet(ctx, functionParent);
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
          if (!ctx.vars.has(functionParent)) {
            return;
          }
          const vars = generateVars(ctx, path, functionParent);
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
              style.value = t.jsxExpressionContainer(
                t.callExpression(vars, []),
              );
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
}

function processTemplateInJSX(
  ctx: StateContext,
  path: NodePath<t.JSXElement>,
  sheet: ScopedSheet,
  isGlobal: boolean,
  parent: {
    root: babel.NodePath;
    statement: babel.NodePath;
    function: Scope;
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

  const cssID = parent.root.scope.generateUidIdentifier('css');

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

  transformJSX(ctx, parent.function);
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
  const functionParent = path.scope.getFunctionParent();
  if (functionParent) {
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
}

function processCSSTaggedTemplate(
  ctx: StateContext,
  path: NodePath<t.TaggedTemplateExpression>,
): void {
  // Get the function parent first
  const functionParent = path.scope.getFunctionParent();
  if (functionParent) {
    const sheet = generateSheet(ctx, functionParent);

    // Convert template into a CSS sheet
    const { sheet: compiledSheet, variables } = processCSSTemplate(
      ctx,
      sheet.scope,
      path.node.quasi,
      true,
    );

    const root = getRootStatementPath(path);

    const cssID = root.scope.generateUidIdentifier('css');

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

    transformJSX(ctx, functionParent);
  }
}

type State = babel.PluginPass & { opts: StateContext };

export default function solidStyledPlugin(): babel.PluginObj<State> {
  return {
    name: 'solid-styled',
    visitor: {
      Program(programPath, state): void {
        const validIdentifiers = new Set();
        const validNamespaces = new Set();

        programPath.traverse({
          ImportDeclaration(path) {
            if (path.node.source.value === SOURCE_MODULE) {
              for (
                let i = 0, len = path.node.specifiers.length;
                i < len;
                i += 1
              ) {
                const specifier = path.node.specifiers[i];
                if (
                  t.isImportSpecifier(specifier) &&
                  getImportSpecifierKey(specifier) === TAGGED_TEMPLATE
                ) {
                  validIdentifiers.add(specifier.local);
                } else if (t.isImportNamespaceSpecifier(specifier)) {
                  validNamespaces.add(specifier.local);
                }
              }
            }
          },
          JSXElement(path) {
            processJSXTemplate(state.opts, path);
          },
          TaggedTemplateExpression(path) {
            if (!t.isStatement(path.parent)) {
              return;
            }
            const trueID = unwrapNode(path.node.tag, t.isIdentifier);
            if (trueID) {
              const binding = path.scope.getBindingIdentifier(trueID.name);
              if (binding && validIdentifiers.has(binding)) {
                processCSSTaggedTemplate(state.opts, path);
              }
              return;
            }
            const trueMember = unwrapNode(path.node.tag, t.isMemberExpression);
            if (
              trueMember &&
              t.isIdentifier(trueMember.property) &&
              !trueMember.computed
            ) {
              const trueObject = unwrapNode(trueMember.object, t.isIdentifier);
              if (trueObject) {
                const binding = path.scope.getBindingIdentifier(
                  trueObject.name,
                );
                if (binding && validNamespaces.has(binding)) {
                  processCSSTaggedTemplate(state.opts, path);
                }
              }
            }
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
