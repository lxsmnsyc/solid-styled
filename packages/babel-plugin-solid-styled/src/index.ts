import { PluginObj } from '@babel/core';
import { addNamed } from '@babel/helper-module-imports';
import { NodePath, Scope } from '@babel/traverse';
import * as t from '@babel/types';
import * as csstree from 'css-tree';
import UniqueIdGenerator from './id-generator';

const ssrUniqueId = new UniqueIdGenerator();
const domUniqueId = new UniqueIdGenerator();
const TAGGED_TEMPLATE = 'css';
const SOURCE_MODULE = 'solid-styled';
const SOLID_STYLED_ATTR = 'data-s';
const VARS_ID = 'vars';
const SHEET_ID = 'sheet';
const GLOBAL_SELECTOR = 'global';

export interface SolidStyledOptions {
  verbose?: boolean;
  prefix?: string;
  ssr?: boolean;
}

interface StateContext {
  hooks: Map<string, t.Identifier>;
  vars: WeakMap<Scope, t.Identifier>;
  sheets: WeakMap<Scope, { sheet: t.Identifier, id: string }>;
  opts: SolidStyledOptions;
}

function getPrefix(ctx: StateContext) {
  return ctx.opts.prefix ? `${ctx.opts.prefix}-` : '';
}

function nextId(ctx: StateContext) {
  return ctx.opts.ssr ? ssrUniqueId.next() : domUniqueId.next();
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
      && t.isJSXIdentifier(attr.name)
      && attr.name.name === `${SOLID_STYLED_ATTR}-${sheetID}`
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
  const program = functionParent.getProgramParent();
  const sheet = program.generateUidIdentifier(SHEET_ID);
  const baseID = nextId(ctx);
  const verboseId = ctx.opts.verbose
    ? `${getFunctionParentName(functionParent)}-${baseID}`
    : baseID;
  const id = `${getPrefix(ctx)}${verboseId}`;
  program.push({
    id: sheet,
    init: t.stringLiteral(id),
    kind: 'const',
  });
  const value = {
    sheet,
    id,
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
          const { id: sheetID } = generateSheet(ctx, functionParent);
          if (checkScopedAttribute(opening, sheetID)) {
            return;
          }
          opening.attributes.push(t.jsxAttribute(
            t.jsxIdentifier(`${SOLID_STYLED_ATTR}-${sheetID}`),
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
  const variables: t.ObjectProperty[] = [];

  let sheet = '';
  let currentExpr = 0;

  for (let i = 0, len = quasis.length; i < len; i += 1) {
    sheet = `${sheet}${quasis[i].value.cooked ?? ''}`;
    if (currentExpr < expressions.length) {
      const expr = expressions[currentExpr];
      if (t.isExpression(expr)) {
        const id = `--s-${getPrefix(ctx)}${nextId(ctx)}`;
        sheet = `${sheet}var(${id})`;
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
  // [data-s-${sheetID}]
  const selector: csstree.AttributeSelector = {
    type: 'AttributeSelector',
    name: {
      type: 'Identifier',
      name: `${SOLID_STYLED_ATTR}-${sheetID}`,
    },
    matcher: null,
    flags: null,
    value: null,
  };

  let inGlobal = false;

  csstree.walk(ast, {
    leave(node: csstree.CssNode) {
      if (node.type === 'Atrule' && node.name === 'global' && node.block) {
        inGlobal = false;
      }
      if (node.type === 'StyleSheet' || node.type === 'Block') {
        const children: csstree.CssNode[] = [];
        node.children.forEach((child) => {
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
      if (inGlobal) {
        return;
      }
      if (node.type === 'Atrule' && node.name === 'global' && node.block) {
        inGlobal = true;
        return;
      }
      if (node.type === 'Selector') {
        const children: csstree.CssNode[] = [];
        let shouldPush = true;
        node.children.forEach((child) => {
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
          if (
            child.type === 'Combinator'
            || child.type === 'WhiteSpace'
          ) {
            children.push(child);
            shouldPush = true;
            return;
          }
          if (child.type === 'PseudoClassSelector') {
            if (child.name === GLOBAL_SELECTOR) {
              child.children?.forEach((innerChild) => {
                children.push(innerChild);
              });
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

function processTemplate(
  ctx: StateContext,
  sheetID: string,
  templateLiteral: t.TemplateLiteral,
  isScoped: boolean,
) {
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

type State = babel.PluginPass & { opts: SolidStyledOptions };

export default function solidStyledPlugin(): PluginObj<State> {
  return {
    name: 'solid-styled',
    visitor: {
      Program(programPath, state) {
        const validIdentifiers = new Set();
        const ctx: StateContext = {
          hooks: new Map(),
          sheets: new WeakMap(),
          vars: new WeakMap(),
          opts: state.opts,
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
                }
              }
            }
          },
          JSXElement(path) {
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
              const { sheet, id: sheetID } = generateSheet(
                ctx,
                functionParent,
              );
              const statement = path.getStatementParent();
              if (statement) {
                for (let i = 0, len = path.node.children.length; i < len; i += 1) {
                  const child = path.node.children[i];
                  if (t.isJSXExpressionContainer(child) && t.isTemplateLiteral(child.expression)) {
                    const { sheet: compiledSheet, variables } = processTemplate(
                      ctx,
                      sheetID,
                      child.expression,
                      !isGlobal,
                    );

                    const cssID = programPath.scope.generateUidIdentifier('css');

                    programPath.scope.push({
                      id: cssID,
                      init: t.stringLiteral(compiledSheet),
                      kind: 'const',
                    });

                    statement.insertBefore(t.callExpression(
                      getHookIdentifier(ctx, path, 'useSolidStyled', SOURCE_MODULE),
                      [
                        sheet,
                        cssID,
                      ],
                    ));

                    if (variables.length) {
                      const vars = generateVars(ctx, path, functionParent);
                      statement.insertBefore(t.callExpression(
                        vars,
                        [t.arrowFunctionExpression([], t.objectExpression(variables))],
                      ));
                    }

                    transformJSX(ctx, functionParent);
                  }
                }
              }
              path.replaceWith(t.jsxFragment(
                t.jsxOpeningFragment(),
                t.jsxClosingFragment(),
                [],
              ));
            }
          },
          TaggedTemplateExpression(path) {
            const { tag } = path.node;
            if (t.isIdentifier(tag)) {
              const binding = path.scope.getBinding(tag.name);
              if (
                binding
                && validIdentifiers.has(binding.identifier)
                && t.isStatement(path.parent)
              ) {
                // Get the function parent first
                const functionParent = path.scope.getFunctionParent();
                if (functionParent) {
                  const { sheet, id: sheetID } = generateSheet(
                    ctx,
                    functionParent,
                  );

                  // Convert template into a CSS sheet
                  const { sheet: compiledSheet, variables } = processTemplate(
                    ctx,
                    sheetID,
                    path.node.quasi,
                    true,
                  );

                  const cssID = programPath.scope.generateUidIdentifier('css');

                  programPath.scope.push({
                    id: cssID,
                    init: t.stringLiteral(compiledSheet),
                    kind: 'const',
                  });

                  path.replaceWith(t.callExpression(
                    getHookIdentifier(ctx, path, 'useSolidStyled', SOURCE_MODULE),
                    [
                      sheet,
                      cssID,
                    ],
                  ));

                  if (variables.length) {
                    const vars = generateVars(ctx, path, functionParent);
                    path.insertAfter(t.callExpression(
                      vars,
                      [t.arrowFunctionExpression([], t.objectExpression(variables))],
                    ));
                  }

                  transformJSX(ctx, functionParent);
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
