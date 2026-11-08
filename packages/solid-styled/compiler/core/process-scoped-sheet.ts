import * as csstree from 'css-tree';
import { GLOBAL_SELECTOR, SOLID_STYLED_NS } from './constants';

/** Replaces `:global(...)` with the selectors it wraps. */
function pushGlobalChildren(target: csstree.CssNode[], pseudo: csstree.PseudoClassSelector): void {
  if (!pseudo.children) {
    return;
  }
  for (const child of pseudo.children) {
    target.push(child);
  }
}

/**
 * Rewrites one selector. With a `marker`, the scoping attribute is inserted
 * once per compound selector; with `null` (inside `@global`) the selector is
 * left alone. Either way `:global(...)` is unwrapped.
 */
function rewriteSelector(node: csstree.Selector, marker: csstree.AttributeSelector | null): void {
  const children: csstree.CssNode[] = [];
  let pending = marker !== null;

  function pushMarker(): void {
    if (pending && marker) {
      children.push(marker);
      pending = false;
    }
  }

  for (const child of node.children) {
    switch (child.type) {
      // The marker goes after the compound selector it scopes.
      case 'TypeSelector':
      case 'ClassSelector':
      case 'IdSelector':
      case 'AttributeSelector': {
        children.push(child);
        pushMarker();
        break;
      }
      // A pseudo element must stay last, so the marker goes before it.
      case 'PseudoElementSelector': {
        pushMarker();
        children.push(child);
        break;
      }
      // A new compound selector starts here.
      case 'Combinator':
      case 'WhiteSpace': {
        children.push(child);
        pending = marker !== null;
        break;
      }
      case 'PseudoClassSelector': {
        if (child.name === GLOBAL_SELECTOR) {
          pushGlobalChildren(children, child);
        } else {
          pushMarker();
          children.push(child);
        }
        break;
      }
      default:
        break;
    }
  }

  node.children = new csstree.List<csstree.CssNode>().fromArray(children);
}

/** Prefixes animation names that refer to a keyframes rule of this sheet. */
function namespaceAnimation(
  node: csstree.Declaration,
  sheetID: string,
  keyframes: Set<unknown>,
): void {
  // `animation` has an arbitrary value order, so every identifier is checked.
  if (node.property !== 'animation' && node.property !== 'animation-name') {
    return;
  }
  if (node.value.type !== 'Value') {
    return;
  }
  for (const item of node.value.children) {
    if (item.type === 'Identifier' && keyframes.has(item.name)) {
      item.name = `${sheetID}-${item.name}`;
    }
  }
}

/**
 * Rewrites a preprocessed sheet so every non-global selector carries the
 * `[s\:<sheetID>]` marker, hoists `@global` blocks, unwraps `:global(...)`,
 * and namespaces keyframes.
 */
export default function processScopedSheet(sheetID: string, content: string): string {
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
        if (node.name === 'keyframes' && node.block && node.prelude?.type === 'AtrulePrelude') {
          for (const child of node.prelude.children) {
            if (child.type === 'Identifier') {
              keyframes.add(child.name);
              child.name = `${sheetID}-${child.name}`;
            }
          }
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
        for (const child of node.children) {
          // This moves all the selectors in `@global`
          if (child.type === 'Atrule' && child.name === 'global' && child.block) {
            for (const innerChild of child.block.children) {
              children.push(innerChild);
            }
          } else {
            children.push(child);
          }
        }
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
      if (inGlobal === 0 && node.type === 'Declaration') {
        namespaceAnimation(node, sheetID, keyframes);
      }
      if (!inKeyframes && node.type === 'Selector') {
        rewriteSelector(node, inGlobal === 0 ? selector : null);
      }
    },
  });

  return csstree.generate(ast);
}
