import * as csstree from 'css-tree';
import { GLOBAL_SELECTOR, SOLID_STYLED_NS } from './constants';
import type { StateContext } from '../types';

export default function processScopedSheet(
  ctx: StateContext,
  sheetID: string,
  content: string,
): string {
  const ast = csstree.parse(content);
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

  const keyframes = new Set();

  // Flag to indicate that the currently visited
  // node is inside a global block
  let inGlobal = 0;
  let inKeyframes = false;

  // Check all keyframes first
  csstree.walk(ast, {
    leave(node: csstree.CssNode) {
      // Check if block is `@global`
      if (node.type === 'Atrule' && node.name === 'global' && node.block) {
        inGlobal -= 1;
      }
    },
    enter(node: csstree.CssNode) {
      // No transforms needed if in global
      // Check if block is `@global`
      if (node.type === 'Atrule') {
        if (node.name === 'global' && node.block) {
          // Shift to global mode
          inGlobal += 1;
          return;
        }
        if (inGlobal > 0) {
          return;
        }
        if (node.name === 'keyframes' && node.block && node.prelude && node.prelude.type === 'AtrulePrelude') {
          node.prelude.children.forEach((child) => {
            if (child.type === 'Identifier') {
              keyframes.add(child.name);
              child.name = `${sheetID}-${child.name}`;
            }
          });
        }
      }
    },
  });

  inGlobal = 0;

  csstree.walk(ast, {
    leave(node: csstree.CssNode) {
      // Check if block is `@global`
      if (node.type === 'Atrule') {
        if (node.name === 'global' && node.block) {
          inGlobal -= 1;
        }
        if (node.name === 'keyframes') {
          inKeyframes = false;
        }
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
      // Check if block is `@global`
      if (node.type === 'Atrule') {
        if (node.name === 'global' && node.block) {
          // Shift to global mode
          inGlobal += 1;
        }
        if (inGlobal === 0 && node.name === 'keyframes') {
          inKeyframes = true;
        }
      }
      if (inGlobal === 0) {
        // Transform animations
        if (node.type === 'Declaration') {
          // animation-name
          switch (node.property) {
            // For some reason, animation has an arbitrary sequence
            // so we just have to guess
            case 'animation':
            case 'animation-name':
              if (node.value.type === 'Value') {
                node.value.children.forEach((item) => {
                  if (item.type === 'Identifier' && keyframes.has(item.name)) {
                    item.name = `${sheetID}-${item.name}`;
                  }
                });
              }
              break;
            default:
              break;
          }
        }
        if (!inKeyframes && node.type === 'Selector') {
          const children: csstree.CssNode[] = [];
          let shouldPush = true;
          node.children.forEach((child) => {
            // Push the selector after the node
            switch (child.type) {
              case 'TypeSelector':
              case 'ClassSelector':
              case 'IdSelector':
              case 'AttributeSelector':
                children.push(child);
                if (shouldPush) {
                  children.push(selector);
                  shouldPush = false;
                }
                break;
              // Push the selector before the node
              case 'PseudoElementSelector':
                if (shouldPush) {
                  children.push(selector);
                  shouldPush = false;
                }
                children.push(child);
                break;
              // Not a selector
              case 'Combinator':
              case 'WhiteSpace':
                children.push(child);
                shouldPush = true;
                break;
              case 'PseudoClassSelector':
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
                break;
              default:
                break;
            }
          });
          node.children = new csstree.List<csstree.CssNode>().fromArray(children);
        }
      }
    },
  });

  return csstree.generate(ast);
}
