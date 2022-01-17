import { PluginObj } from '@babel/core';
import { addNamed } from '@babel/helper-module-imports';
import { NodePath, Scope } from '@babel/traverse';
import * as t from '@babel/types';
import * as csstree from 'css-tree';
import { customAlphabet } from 'nanoid';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789_-';
const nanoid = customAlphabet(ALPHABET, 10);
const TAGGED_TEMPLATE = 'css';
const SOURCE_MODULE = 'solid-styled';
const SOLID_STYLED_ATTR = 'data-s';
const SCOPE_ID = 'scope';
const SHEET_ID = 'sheet';
const GLOBAL_SELECTOR = 'global';

type ImportHook = Map<string, t.Identifier>;

function getHookIdentifier(
  hooks: ImportHook,
  path: NodePath,
  name: string,
  source = 'solid-js',
): t.Identifier {
  const current = hooks.get(name);
  if (current) {
    return current;
  }
  const newID = addNamed(path, name, source);
  hooks.set(name, newID);
  return newID;
}

function isValidSpecifier(specifier: t.ImportSpecifier): boolean {
  return (
    (t.isIdentifier(specifier.imported) && specifier.imported.name === TAGGED_TEMPLATE)
    || (t.isStringLiteral(specifier.imported) && specifier.imported.value === TAGGED_TEMPLATE)
  );
}

interface ScopeMeta {
  scope: t.Identifier;
  sheet: t.Identifier;
  sheetID: string;
}

export default function solidStyledPlugin(): PluginObj {
  return {
    name: 'solid-styled',
    visitor: {
      Program(programPath) {
        const validIdentifiers = new Set();
        const hooks: ImportHook = new Map();
        const meta = new WeakMap<Scope, ScopeMeta>();

        function getScopeMeta(path: NodePath, functionParent: Scope): ScopeMeta {
          const result = meta.get(functionParent);
          if (result) {
            return result;
          }
          const scope = path.scope.generateUidIdentifier(SCOPE_ID);
          const sheet = path.scope.generateUidIdentifier(SHEET_ID);
          functionParent.push({
            id: scope,
            init: t.callExpression(
              getHookIdentifier(hooks, path, 'createUniqueId', 'solid-js'),
              [],
            ),
            kind: 'const',
          });
          const sheetID = nanoid();
          functionParent.push({
            id: sheet,
            init: t.stringLiteral(sheetID),
            kind: 'const',
          });
          const metaValue = {
            scope,
            sheet,
            sheetID,
          };
          meta.set(functionParent, metaValue);
          return metaValue;
        }

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
          TaggedTemplateExpression(path) {
            const { tag } = path.node;
            if (t.isIdentifier(tag)) {
              const binding = path.scope.getBinding(tag.name);
              if (binding && validIdentifiers.has(binding.identifier)) {
                // Get the function parent first
                const functionParent = path.scope.getFunctionParent();
                if (functionParent) {
                  const { scope, sheet, sheetID } = getScopeMeta(path, functionParent);

                  // Convert template into a CSS sheet
                  const { expressions, quasis } = path.node.quasi;

                  const variables: t.ObjectProperty[] = [];

                  let cssSheet = '';
                  let a = 0;

                  for (let i = 0, len = quasis.length; i < len; i += 1) {
                    cssSheet = `${cssSheet}${quasis[i].value.cooked ?? ''}`;
                    if (a < expressions.length) {
                      const expr = expressions[a];
                      if (t.isExpression(expr)) {
                        const id = nanoid();
                        cssSheet = `${cssSheet}var(--${id})`;
                        variables.push(t.objectProperty(
                          t.stringLiteral(id),
                          t.arrowFunctionExpression([], expr),
                          true,
                        ));
                        a += 1;
                      }
                    }
                  }

                  const ast = csstree.parse(cssSheet);
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
                  csstree.walk(ast, (node) => {
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
                      // eslint-disable-next-line no-param-reassign
                      node.children = new csstree.List<csstree.CssNode>().fromArray(children);
                    }
                  });
                  const compiledSheet = csstree.generate(ast);

                  path.replaceWith(t.callExpression(
                    getHookIdentifier(hooks, path, 'useSolidStyled', SOURCE_MODULE),
                    [
                      sheet,
                      scope,
                      t.objectExpression(variables),
                      t.stringLiteral(compiledSheet),
                    ],
                  ));
                }
              }
            }
          },
          JSXElement(path) {
            const opening = path.node.openingElement;

            if (t.isJSXNamespacedName(opening.name) || t.isJSXMemberExpression(opening.name)) {
              return;
            }
            if (/^[a-z]/.test(opening.name.name)) {
              const functionParent = path.scope.getFunctionParent();
              if (functionParent) {
                const { sheetID, scope } = getScopeMeta(path, functionParent);
                opening.attributes.push(t.jsxAttribute(
                  t.jsxIdentifier(`${SOLID_STYLED_ATTR}-${sheetID}`),
                  t.jsxExpressionContainer(scope),
                ));
              }
            }
          },
        });
        programPath.scope.crawl();
      },
    },
  };
}
