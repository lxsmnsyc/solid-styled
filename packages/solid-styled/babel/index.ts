import { PluginObj } from '@babel/core';
import { addNamed } from '@babel/helper-module-imports';
import { NodePath, Scope } from '@babel/traverse';
import * as t from '@babel/types';
import * as csstree from 'css-tree';
import { xxHash32 } from 'js-xxhash';

function getFileId(file: string) {
  return xxHash32(file).toString(16);
}

// The identifier for the tagged template
const TAGGED_TEMPLATE = 'css';
// The module
const SOURCE_MODULE = 'solid-styled';
// The namespace used for scoping
const SOLID_STYLED_NS = 's';
const VARS_ID = 'vars';
const SHEET_ID = 'sheet';
const GLOBAL_SELECTOR = 'global';

export interface SolidStyledOptions {
  verbose?: boolean;
  prefix?: string;
  source?: string;
}

interface ScopedSheet {
  id: t.Identifier;
  scope: string;
  count: number;
}

interface StateContext {
  hooks: Map<string, t.Identifier>;
  vars: WeakMap<Scope, t.Identifier>;
  sheets: WeakMap<Scope, ScopedSheet>;
  opts: SolidStyledOptions;
  ids: number;
  ns: string;
}

function getUniqueId(ctx: StateContext) {
  const currentID = ctx.ids;
  ctx.ids += 1;
  return `${ctx.ns}-${currentID}`;
}

function getPrefix(ctx: StateContext, isVar = false) {
  const defaultPrefix = isVar ? 'v-' : 'c-';
  return ctx.opts.prefix ? `${ctx.opts.prefix}-` : defaultPrefix;
}

function getHookIdentifier(
  ctx: StateContext,
  path: NodePath,
  name: string,
  source = 'solid-js',
): t.Identifier {
  const current = ctx.hooks.get(name);
  if (current) {
    return current;
  }
  const newID = addNamed(path, name, source);
  ctx.hooks.set(name, newID);
  return newID;
}

function isValidSpecifier(specifier: t.ImportSpecifier): boolean {
  return (
    (t.isIdentifier(specifier.imported) && specifier.imported.name === TAGGED_TEMPLATE)
    || (t.isStringLiteral(specifier.imported) && specifier.imported.value === TAGGED_TEMPLATE)
  );
}

function isUseAttribute(name: t.JSXNamespacedName | t.JSXIdentifier): boolean {
  return (
    t.isJSXNamespacedName(name)
    && name.namespace.name === 'use'
    && name.name.name === 'solid-styled'
  );
}

function checkScopedAttribute(opening: t.JSXOpeningElement, sheetID: string): boolean {
  for (let i = 0, len = opening.attributes.length; i < len; i += 1) {
    const attr = opening.attributes[i];
    if (
      t.isJSXAttribute(attr)
      && t.isJSXNamespacedName(attr.name)
      && attr.name.namespace.name === SOLID_STYLED_NS
      && attr.name.name.name === sheetID
    ) {
      return true;
    }
  }
  return false;
}

function checkUseAttribute(opening: t.JSXOpeningElement): boolean {
  for (let i = 0, len = opening.attributes.length; i < len; i += 1) {
    const attr = opening.attributes[i];
    if (
      t.isJSXAttribute(attr)
      && isUseAttribute(attr.name)
    ) {
      return true;
    }
  }
  return false;
}

function generateVars(
  ctx: StateContext,
  path: NodePath,
  functionParent: Scope,
) {
  const result = ctx.vars.get(functionParent);
  if (result) {
    return result;
  }
  const vars = functionParent.generateUidIdentifier(VARS_ID);
  functionParent.push({
    id: vars,
    init: t.callExpression(
      getHookIdentifier(ctx, path, 'createCSSVars', SOURCE_MODULE),
      [],
    ),
    kind: 'const',
  });
  ctx.vars.set(functionParent, vars);
  return vars;
}

function getFunctionParentName(functionParent: Scope): string {
  const { node } = functionParent.path;
  if ((t.isFunctionExpression(node) || t.isFunctionDeclaration(node)) && t.isIdentifier(node.id)) {
    return node.id.name;
  }
  return 'Anonymous';
}

function generateSheet(
  ctx: StateContext,
  functionParent: Scope,
) {
  const result = ctx.sheets.get(functionParent);
  if (result) {
    return result;
  }
  // Get the function parent
  const program = functionParent.getProgramParent();
  // Generate an id
  const baseID = getUniqueId(ctx);
  const verboseId = ctx.opts.verbose
    ? `${getFunctionParentName(functionParent)}-${baseID}`
    : baseID;
  // Finalize ID generation
  const scope = `${getPrefix(ctx)}${verboseId}`;

  // Create a unique identifier for the scope
  const id = program.generateUidIdentifier(SHEET_ID);
  program.push({
    id,
    init: t.stringLiteral(scope),
    kind: 'const',
  });
  const value: ScopedSheet = {
    id,
    scope,
    count: 0,
  };
  ctx.sheets.set(functionParent, value);
  return value;
}

function getStyleAttribute(opening: t.JSXOpeningElement) {
  for (let i = 0, len = opening.attributes.length; i < len; i += 1) {
    const attr = opening.attributes[i];
    if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name) && attr.name.name === 'style') {
      return attr;
    }
  }
  return null;
}

function transformJSX(
  ctx: StateContext,
  functionParent: Scope,
) {
  if (ctx.sheets.has(functionParent)) {
    functionParent.path.traverse({
      JSXElement(path) {
        const opening = path.node.openingElement;
        if (
          (t.isJSXIdentifier(opening.name) && /^[a-z]/.test(opening.name.name))
          || checkUseAttribute(opening)
        ) {
          const sheet = generateSheet(ctx, functionParent);
          if (checkScopedAttribute(opening, sheet.scope)) {
            return;
          }
          opening.attributes.push(t.jsxAttribute(
            t.jsxNamespacedName(
              t.jsxIdentifier(SOLID_STYLED_NS),
              t.jsxIdentifier(sheet.scope),
            ),
          ));
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
                t.isJSXExpressionContainer(style.value)
                && t.isExpression(style.value.expression)
              ) {
                expr = style.value.expression;
              } else if (t.isStringLiteral(style.value)) {
                expr = style.value;
              } else {
                throw new Error('Invalid style value');
              }
              style.value = t.jsxExpressionContainer(
                t.callExpression(
                  getHookIdentifier(ctx, path, 'mergeStyles', SOURCE_MODULE),
                  [
                    expr,
                    t.callExpression(vars, []),
                  ],
                ),
              );
            } else {
              style.value = t.jsxExpressionContainer(t.callExpression(vars, []));
            }
          } else {
            opening.attributes.push(t.jsxAttribute(
              t.jsxIdentifier('style'),
              t.jsxExpressionContainer(t.callExpression(vars, [])),
            ));
          }
        }
      },
    });
  }
}

function replaceDynamicTemplate(
  ctx: StateContext,
  { expressions, quasis }: t.TemplateLiteral,
) {
  // Collects all the variables
  const variables: t.ObjectProperty[] = [];

  let sheet = '';
  let currentExpr = 0;

  for (let i = 0, len = quasis.length; i < len; i += 1) {
    sheet = `${sheet}${quasis[i].value.cooked ?? ''}`;
    if (currentExpr < expressions.length) {
      const expr = expressions[currentExpr];
      if (t.isExpression(expr)) {
        // Create a new variable
        const id = `--s-${getPrefix(ctx, true)}${getUniqueId(ctx)}`;
        // Push the variable access
        sheet = `${sheet}var(${id})`;
        // Register the variable and its expression
        variables.push(t.objectProperty(
          t.stringLiteral(id),
          expr,
        ));
        currentExpr += 1;
      }
    }
  }

  return {
    sheet,
    variables,
  };
}

function processScopedSheet(
  sheetID: string,
  ast: csstree.CssNode,
) {
  // This selector is going to be inserted
  // on every non-global selector
  // [s\:${sheetID}]
  const selector: csstree.AttributeSelector = {
    type: 'AttributeSelector',
    name: {
      type: 'Identifier',
      name: `${SOLID_STYLED_NS}\\:${sheetID}`,
    },
    matcher: null,
    flags: null,
    value: null,
  };

  // Flag to indicate that the currently visited
  // node is inside a global block
  let inGlobal = false;

  csstree.walk(ast, {
    leave(node: csstree.CssNode) {
      // Check if block is `@global`
      if (node.type === 'Atrule' && node.name === 'global' && node.block) {
        inGlobal = false;
      }
      if (node.type === 'StyleSheet' || node.type === 'Block') {
        const children: csstree.CssNode[] = [];
        node.children.forEach((child) => {
          // This moves all the selectors in `@global`
          if (child.type === 'Atrule' && child.name === 'global' && child.block) {
            child.block.children.forEach((innerChild) => {
              children.push(innerChild);
            });
          } else {
            children.push(child);
          }
        });
        node.children = new csstree.List<csstree.CssNode>().fromArray(children);
      }
    },
    enter(node: csstree.CssNode) {
      // No transforms needed if in global
      if (inGlobal) {
        return;
      }
      // Check if block is `@global`
      if (node.type === 'Atrule' && node.name === 'global' && node.block) {
        // Shift to global mode
        inGlobal = true;
        return;
      }
      if (node.type === 'Selector') {
        const children: csstree.CssNode[] = [];
        let shouldPush = true;
        node.children.forEach((child) => {
          // Push the selector after the node
          if (
            child.type === 'TypeSelector'
            || child.type === 'ClassSelector'
            || child.type === 'IdSelector'
            || child.type === 'AttributeSelector'
          ) {
            children.push(child);
            if (shouldPush) {
              children.push(selector);
              shouldPush = false;
            }
            return;
          }
          // Push the selector before the node
          if (
            child.type === 'PseudoElementSelector'
          ) {
            if (shouldPush) {
              children.push(selector);
              shouldPush = false;
            }
            children.push(child);
            return;
          }
          // Not a selector
          if (
            child.type === 'Combinator'
            || child.type === 'WhiteSpace'
          ) {
            children.push(child);
            shouldPush = true;
            return;
          }
          if (child.type === 'PseudoClassSelector') {
            // `:global`
            if (child.name === GLOBAL_SELECTOR) {
              if (child.children) {
                child.children.forEach((innerChild) => {
                  children.push(innerChild);
                });
              }
            } else {
              if (shouldPush) {
                children.push(selector);
                shouldPush = false;
              }
              children.push(child);
            }
          }
        });
        node.children = new csstree.List<csstree.CssNode>().fromArray(children);
      }
    },
  });
}

function processCSSTemplate(
  ctx: StateContext,
  sheetID: string,
  templateLiteral: t.TemplateLiteral,
  isScoped: boolean,
) {
  // Replace the template's dynamic parts with CSS variables
  const { sheet, variables } = replaceDynamicTemplate(ctx, templateLiteral);

  const ast = csstree.parse(sheet);

  if (isScoped) {
    processScopedSheet(sheetID, ast);
  }

  const compiledSheet = csstree.generate(ast);

  return {
    sheet: compiledSheet,
    variables,
  };
}

function processJSXTemplate(
  ctx: StateContext,
  programPath: NodePath<t.Program>,
  path: NodePath<t.JSXElement>,
) {
  const opening = path.node.openingElement;
  if (!t.isJSXIdentifier(opening.name)) {
    return;
  }
  if (opening.name.name !== 'style') {
    return;
  }
  let isGlobal = false;
  let isJSX = false;
  for (let i = 0, len = opening.attributes.length; i < len; i += 1) {
    const attr = opening.attributes[i];
    if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name)) {
      if (attr.name.name === 'jsx') {
        isJSX = true;
      }
      if (attr.name.name === 'global') {
        isGlobal = true;
      }
    }
  }
  if (!isJSX) {
    return;
  }
  const functionParent = path.scope.getFunctionParent();
  if (functionParent) {
    const sheet = generateSheet(
      ctx,
      functionParent,
    );
    const statement = path.getStatementParent();
    if (statement) {
      for (let i = 0, len = path.node.children.length; i < len; i += 1) {
        const child = path.node.children[i];
        if (t.isJSXExpressionContainer(child) && t.isTemplateLiteral(child.expression)) {
          const { sheet: compiledSheet, variables } = processCSSTemplate(
            ctx,
            sheet.scope,
            child.expression,
            !isGlobal,
          );

          const cssID = programPath.scope.generateUidIdentifier('css');

          programPath.scope.push({
            id: cssID,
            init: t.stringLiteral(compiledSheet),
            kind: 'const',
          });

          const current = sheet.count += 1;
          sheet.count = current;

          const vars = generateVars(ctx, path, functionParent);
          statement.insertBefore(t.expressionStatement(
            t.sequenceExpression([
              t.callExpression(
                getHookIdentifier(ctx, path, 'useSolidStyled', SOURCE_MODULE),
                [
                  t.binaryExpression('+', sheet.id, t.stringLiteral(`-${current}`)),
                  cssID,
                ],
              ),
              ...(
                variables.length
                  ? [t.callExpression(
                    vars,
                    [t.arrowFunctionExpression([], t.objectExpression(variables))],
                  )]
                  : []
              ),
            ]),
          ));

          transformJSX(ctx, functionParent);
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
  programPath: NodePath<t.Program>,
  path: NodePath<t.TaggedTemplateExpression>,
) {
  // Get the function parent first
  const functionParent = path.scope.getFunctionParent();
  if (functionParent) {
    const sheet = generateSheet(
      ctx,
      functionParent,
    );

    // Convert template into a CSS sheet
    const { sheet: compiledSheet, variables } = processCSSTemplate(
      ctx,
      sheet.scope,
      path.node.quasi,
      true,
    );

    const cssID = programPath.scope.generateUidIdentifier('css');

    programPath.scope.push({
      id: cssID,
      init: t.stringLiteral(compiledSheet),
      kind: 'const',
    });

    const current = sheet.count += 1;
    sheet.count = current;

    const vars = generateVars(ctx, path, functionParent);

    path.replaceWith(t.expressionStatement(
      t.sequenceExpression([
        t.callExpression(
          getHookIdentifier(ctx, path, 'useSolidStyled', SOURCE_MODULE),
          [
            t.binaryExpression('+', sheet.id, t.stringLiteral(`-${current}`)),
            cssID,
          ],
        ),
        ...(
          variables.length
            ? [t.callExpression(
              vars,
              [t.arrowFunctionExpression([], t.objectExpression(variables))],
            )]
            : []
        ),
      ]),
    ));

    transformJSX(ctx, functionParent);
  }
}

type State = babel.PluginPass & { opts: SolidStyledOptions };

export default function solidStyledPlugin(): PluginObj<State> {
  return {
    name: 'solid-styled',
    visitor: {
      Program(programPath, state) {
        const validIdentifiers = new Set();
        const validNamespaces = new Set();
        const ctx: StateContext = {
          hooks: new Map(),
          sheets: new WeakMap(),
          vars: new WeakMap(),
          opts: state.opts,
          ns: getFileId(state.opts.source ?? state.filename ?? ''),
          ids: 0,
        };

        programPath.traverse({
          ImportDeclaration(path) {
            if (path.node.source.value === SOURCE_MODULE) {
              for (let i = 0, len = path.node.specifiers.length; i < len; i += 1) {
                const specifier = path.node.specifiers[i];
                if (
                  t.isImportSpecifier(specifier)
                  && isValidSpecifier(specifier)
                ) {
                  validIdentifiers.add(specifier.local);
                } else if (t.isImportNamespaceSpecifier(specifier)) {
                  validNamespaces.add(specifier.local);
                }
              }
            }
          },
          JSXElement(path) {
            processJSXTemplate(
              ctx,
              programPath,
              path,
            );
          },
          TaggedTemplateExpression(path) {
            if (!t.isStatement(path.parent)) {
              return;
            }
            const { tag } = path.node;
            if (t.isIdentifier(tag)) {
              const binding = path.scope.getBindingIdentifier(tag.name);
              if (
                binding
                && validIdentifiers.has(binding)
              ) {
                processCSSTaggedTemplate(
                  ctx,
                  programPath,
                  path,
                );
              }
            } else if (
              t.isMemberExpression(tag)
              && t.isIdentifier(tag.object)
              && t.isIdentifier(tag.property)
              && !tag.computed
            ) {
              const binding = path.scope.getBindingIdentifier(tag.object.name);
              if (
                binding
                && validNamespaces.has(binding)
              ) {
                processCSSTaggedTemplate(
                  ctx,
                  programPath,
                  path,
                );
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
