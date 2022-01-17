import { PluginObj } from '@babel/core';
import { addNamed } from '@babel/helper-module-imports';
import { NodePath, Scope } from '@babel/traverse';
import * as t from '@babel/types';
import * as csstree from 'css-tree';
import { nanoid } from 'nanoid';

const TAGGED_TEMPLATE = 'css';
const SOURCE_MODULE = 'solid-styled';
const SOLID_STYLED_ATTR = 'data-solid-styled';
const SCOPE_ID = '$$scope';
const SHEET_ID = '$$sheet';
const SCOPE_LENGTH = 8;
const VAR_LENGTH = 4;

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

export default function solidStyledPlugin(): PluginObj {
  return {
    name: 'solid-styled',
    visitor: {
      Program(programPath) {
        const validIdentifiers = new Set();
        const hooks: ImportHook = new Map();
        const meta = new WeakMap<Scope, string>();

        function getSheetID(path: NodePath, functionParent: Scope): string {
          let result = meta.get(functionParent);
          if (result) {
            return result;
          }
          functionParent.push({
            id: t.identifier(SCOPE_ID),
            init: t.callExpression(
              getHookIdentifier(hooks, path, 'createUniqueId', 'solid-js'),
              [],
            ),
            kind: 'const',
          });
          const sheetID = nanoid(SCOPE_LENGTH);
          functionParent.push({
            id: t.identifier(SHEET_ID),
            init: t.stringLiteral(sheetID),
            kind: 'const',
          });

          meta.set(functionParent, sheetID);
          
          return sheetID;
        }

        programPath.traverse({
          ImportDeclaration(path) {
            if (path.node.source.value === SOURCE_MODULE) {
              for (let i = 0, len = path.node.specifiers.length; i < len; i += 1) {
                const specifier = path.node.specifiers[i];
                if (
                  t.isImportSpecifier(specifier)
                  && (
                    (t.isIdentifier(specifier.imported) && specifier.imported.name === TAGGED_TEMPLATE)
                    || (t.isStringLiteral(specifier.imported) && specifier.imported.value === TAGGED_TEMPLATE)
                   )
                ) {
                  validIdentifiers.add(specifier.local);
                }
              }
            }
          },
          TaggedTemplateExpression(path) {
            const tag = path.node.tag;
            if (t.isIdentifier(tag)) {
              const binding = path.scope.getBinding(tag.name);
              if (binding && validIdentifiers.has(binding.identifier)) {
                // Get the function parent first
                const functionParent = path.scope.getFunctionParent();
                if (functionParent) {
                  const sheetID = getSheetID(path, functionParent);

                  // Convert template into a CSS sheet
                  const { expressions, quasis } = path.node.quasi;

                  const variables: t.ObjectProperty[] = [];

                  let sheet = '';
                  let a = 0;

                  for (let i = 0, len = quasis.length; i < len; i += 1) {
                    sheet = `${sheet}${quasis[i].value.cooked}`;
                    if (a < expressions.length) {
                      const expr = expressions[a];
                      if (t.isExpression(expr)) {
                        const id = nanoid(VAR_LENGTH);
                        sheet = `${sheet}var(--${id})`;
                        variables.push(t.objectProperty(
                          t.identifier(id),
                          t.arrowFunctionExpression([], expr),
                        ));
                        a += 1;
                      }
                    }
                  }

                  const ast = csstree.parse(sheet)
                  csstree.walk(ast, (node) => {
                    if (node.type === 'Selector') {
                      node.children.push({
                        type: "AttributeSelector",
                        name: {
                          type: 'Identifier',
                          name: `${SOLID_STYLED_ATTR}-${sheetID}`,
                        },
                        matcher: null,
                        flags: null,
                        value: null,
                      });
                    }
                  });
                  const compiledSheet = csstree.generate(ast);

                  path.replaceWith(t.callExpression(
                    getHookIdentifier(hooks, path, 'useSolidStyled', SOURCE_MODULE),
                    [
                      t.identifier(SHEET_ID),
                      t.stringLiteral(compiledSheet),
                      t.identifier(SCOPE_ID),
                      t.objectExpression(variables),
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
                const sheetID = getSheetID(path, functionParent);
                opening.attributes.push(t.jsxAttribute(
                  t.jsxIdentifier(`${SOLID_STYLED_ATTR}-${sheetID}`),
                  t.jsxExpressionContainer(t.identifier(SCOPE_ID)),
                ));
              }
            }
          },
        });
        programPath.scope.crawl();
      },
    },
  }
}