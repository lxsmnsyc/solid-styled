/* eslint-disable @typescript-eslint/no-use-before-define */
import * as lightningcss from 'lightningcss';
import assert from './assert';

/**
 * NOTICE
 *
 * This entire module was only made because LightningCSS refuses to
 * parse :global if the transform option for CSS modules isn't enabled.
 *
 * Since :global is treated as a custom-function token in LightningCSS,
 * the arguments must be transformed into its AST counterpart. This took
 * me a while to do, specially since attribute selectors, pseudo-class
 * selectors and pseudo-element selectors has some quirky syntax.
 */

type PseudoClassKind = (lightningcss.TSPseudoClass | lightningcss.PseudoClass)['kind'];

interface PseudoClassVendorPrefixData {
  name: PseudoClassKind;
  vendorPrefix: lightningcss.Prefix[];
}

const PSEUDO_CLASS_VENDOR_PREFIX: Record<string, PseudoClassVendorPrefixData> = {
  '-webkit-full-screen': {
    name: 'fullscreen',
    vendorPrefix: ['webkit'],
  },
  '-moz-full-screen': {
    name: 'fullscreen',
    vendorPrefix: ['moz'],
  },
  '-ms-fullscreen': {
    name: 'fullscreen',
    vendorPrefix: ['ms'],
  },
  '-webkit-any-link': {
    name: 'any-link',
    vendorPrefix: ['webkit'],
  },
  '-moz-any-link': {
    name: 'any-link',
    vendorPrefix: ['moz'],
  },
  '-moz-read-only': {
    name: 'read-only',
    vendorPrefix: ['moz'],
  },
  '-moz-read-write': {
    name: 'read-write',
    vendorPrefix: ['moz'],
  },
  '-moz-placeholder': {
    name: 'placeholder-shown',
    vendorPrefix: ['moz'],
  },
  '-ms-input-placeholder': {
    name: 'placeholder-shown',
    vendorPrefix: ['ms'],
  },
  '-webkit-autofill': {
    name: 'autofill',
    vendorPrefix: ['webkit'],
  },
  '-webkit-any': {
    name: 'any',
    vendorPrefix: ['webkit'],
  },
  '-moz-any': {
    name: 'any',
    vendorPrefix: ['moz'],
  },
};

function getPseudoClassVendorPrefix(value: PseudoClassKind): PseudoClassVendorPrefixData {
  if (value in PSEUDO_CLASS_VENDOR_PREFIX) {
    return PSEUDO_CLASS_VENDOR_PREFIX[value];
  }
  return { name: value, vendorPrefix: [] };
}

function identTokenToPseudoClassSelector(
  value: PseudoClassKind,
): lightningcss.SelectorComponent {
  const { name, vendorPrefix } = getPseudoClassVendorPrefix(value);
  switch (name) {
    case 'first-child':
    case 'last-child':
    case 'only-child':
    case 'root':
    case 'empty':
    case 'scope':
    case 'first-of-type':
    case 'last-of-type':
    case 'only-of-type':
    case 'hover':
    case 'active':
    case 'focus':
    case 'focus-visible':
    case 'focus-within':
    case 'current':
    case 'past':
    case 'future':
    case 'playing':
    case 'paused':
    case 'seeking':
    case 'buffering':
    case 'stalled':
    case 'muted':
    case 'volume-locked':
    case 'defined':
      return {
        type: 'pseudo-class',
        kind: name,
      };
    // For some reason this errors
    case 'link':
    case 'local-link':
    case 'target':
    case 'target-within':
    case 'visited':
    case 'enabled':
    case 'disabled':
    case 'default':
    case 'checked':
    case 'indeterminate':
    case 'blank':
    case 'valid':
    case 'invalid':
    case 'in-range':
    case 'out-of-range':
    case 'required':
    case 'optional':
    case 'user-valid':
    case 'user-invalid':
      return {
        type: 'pseudo-class',
        kind: name,
      };
    case 'fullscreen':
    case 'any-link':
    case 'read-only':
    case 'read-write':
    case 'placeholder-shown':
    case 'autofill':
      return {
        type: 'pseudo-class',
        kind: name,
        vendorPrefix,
      };
    // TODO Webkit Scrollbar
    default:
      return {
        type: 'pseudo-class',
        kind: 'custom',
        name,
      };
  }
}

function functionTokenToPseudoClassSelector(
  token: lightningcss.Function,
): lightningcss.SelectorComponent {
  const { name, vendorPrefix } = getPseudoClassVendorPrefix(
    token.name as PseudoClassKind,
  );
  switch (name) {
    case 'dir': {
      assert(token.arguments.length === 1, 'Unexpected arguments');
      const arg = token.arguments[0];
      assert(arg.type === 'token', 'Unexpected value type');
      assert(arg.value.type === 'ident', 'Unexpected token type');
      assert(arg.value.value === 'rtl' || arg.value.value === 'ltr', 'Unexpected ident value');
      return {
        type: 'pseudo-class',
        kind: 'dir',
        direction: arg.value.value,
      };
    }
    case 'has':
      return {
        type: 'pseudo-class',
        kind: 'has',
        selectors: tokensToSelectorsList(token.arguments),
      };
    case 'host': {
      const selectors = tokensToSelectorsList(token.arguments);
      assert(selectors.length === 1, 'Unexpected selector list');
      return {
        type: 'pseudo-class',
        kind: 'host',
        selectors: selectors[0],
      };
    }
    case 'is':
      return {
        type: 'pseudo-class',
        kind: 'is',
        selectors: tokensToSelectorsList(token.arguments),
      };
    case 'lang': {
      const languages: string[] = [];
      for (let i = 0, len = token.arguments.length; i < len; i += 1) {
        const arg = token.arguments[i];
        assert(arg.type === 'token', 'Unexpected argument');
        if (arg.value.type === 'ident' || arg.value.type === 'string') {
          languages.push(arg.value.value);
        } else {
          assert(arg.value.type === 'comma', 'Unexpected token');
        }
      }
      return {
        type: 'pseudo-class',
        kind: 'lang',
        languages,
      };
    }
    case 'not':
      return {
        type: 'pseudo-class',
        kind: 'not',
        selectors: tokensToSelectorsList(token.arguments),
      };
    case 'nth-child':
    case 'nth-col':
    case 'nth-last-child':
    case 'nth-last-col':
    case 'nth-last-of-type':
    case 'nth-of-type': {
      // TODO add support for An + B of S
      assert(token.arguments.length > 0, 'Unexpected arguments');
      const [partA, partB] = token.arguments;
      // Parse first part
      assert(partA.type === 'token', 'Unexpected value');
      let a = 0;
      let b = 0;

      switch (partA.value.type) {
        case 'number':
        case 'dimension':
          a = partA.value.value;
          break;
        case 'ident':
          switch (partA.value.value) {
            case 'even':
              a = 2;
              b = 0;
              break;
            case 'odd':
              a = 2;
              b = 1;
              break;
            case 'n':
              a = 1;
              break;
            case '-n':
              a = -1;
              break;
            default:
              throw new Error('Unexpected ident');
          }
          break;
        default:
          throw new Error('Unexpected argument');
      }
      if (partB) {
        assert(partB.type === 'token', 'Unexpected value');
        assert(partB.value.type === 'number', 'Unexpected token');
        b = partB.value.value;
      }
      return {
        type: 'pseudo-class',
        kind: name,
        a,
        b,
      };
    }
    case 'where':
      return {
        type: 'pseudo-class',
        kind: 'where',
        selectors: tokensToSelectorsList(token.arguments),
      };
    case 'any':
      return {
        type: 'pseudo-class',
        kind: 'any',
        selectors: tokensToSelectorsList(token.arguments),
        vendorPrefix,
      };
    default:
      return {
        type: 'pseudo-class',
        kind: 'custom-function',
        name,
        arguments: token.arguments,
      };
  }
}

type PseudoElementKind = (lightningcss.BuiltinPseudoElement | lightningcss.PseudoElement)['kind'];

interface PseudoElementVendorPrefixData {
  name: PseudoElementKind;
  vendorPrefix: lightningcss.Prefix[];
}

const PSEUDO_ELEMENT_VENDOR_PREFIX: Record<string, PseudoElementVendorPrefixData> = {
  '-webkit-backdrop': {
    name: 'backdrop',
    vendorPrefix: ['webkit'],
  },
  '-ms-backdrop': {
    name: 'backdrop',
    vendorPrefix: ['ms'],
  },
  '-webkit-file-upload-button': {
    name: 'file-selector-button',
    vendorPrefix: ['webkit'],
  },
  '-ms-browse': {
    name: 'file-selector-button',
    vendorPrefix: ['ms'],
  },
  // TODO add placeholder to pseudo-class
  '-webkit-input-placeholder ': {
    name: 'placeholder',
    vendorPrefix: ['webkit'],
  },
  '-moz-placeholder': {
    name: 'placeholder',
    vendorPrefix: ['moz'],
  },
  '-ms-input-placeholder': {
    name: 'placeholder',
    vendorPrefix: ['ms'],
  },
  '-moz-selection': {
    name: 'selection',
    vendorPrefix: ['moz'],
  },
};

function getPseudoElementVendorPrefix(value: PseudoElementKind): PseudoElementVendorPrefixData {
  if (value in PSEUDO_ELEMENT_VENDOR_PREFIX) {
    return PSEUDO_ELEMENT_VENDOR_PREFIX[value];
  }
  return { name: value, vendorPrefix: [] };
}

function identTokenToPseudoElementSelector(
  value: PseudoElementKind,
): lightningcss.SelectorComponent {
  const { name, vendorPrefix } = getPseudoElementVendorPrefix(value);
  switch (name) {
    case 'after':
    case 'before':
    case 'cue':
    case 'cue-region':
    case 'first-letter':
    case 'first-line':
    case 'marker':
      return {
        type: 'pseudo-element',
        kind: name,
      };
    case 'backdrop':
    case 'file-selector-button':
    case 'placeholder':
    case 'selection':
      return {
        type: 'pseudo-element',
        kind: name,
        vendorPrefix,
      };
    default:
      return {
        type: 'pseudo-element',
        kind: 'custom',
        name,
      };
  }
}

function functionTokenToPseudoElementSelector(
  token: lightningcss.Function,
): lightningcss.SelectorComponent {
  switch (token.name) {
    case 'slotted':
    case 'cue-function':
    case 'cue-region-function':
      assert(token.arguments.length === 1, 'Unexpected arguments');
      return {
        type: 'pseudo-element',
        kind: token.name,
        selector: tokensToSelectorsList(token.arguments)[0],
      };
    case 'part': {
      const names: string[] = [];
      for (let i = 0, len = token.arguments.length; i < len; i += 1) {
        const arg = token.arguments[i];
        assert(arg.type === 'token', 'Unexpected argument');
        if (arg.value.type === 'ident' || arg.value.type === 'string') {
          names.push(arg.value.value);
        } else {
          assert(arg.value.type === 'comma', 'Unexpected token');
        }
      }
      return {
        type: 'pseudo-element',
        kind: 'part',
        names,
      };
    }
    default:
      return {
        type: 'pseudo-element',
        kind: 'custom-function',
        name: token.name,
        arguments: token.arguments,
      };
  }
}

type OperatorToken =
  | 'prefix-match'
  | 'substring-match'
  | 'suffix-match'
  | 'include-match'
  | 'dash-match';

function tokenToOperation(operator: OperatorToken): lightningcss.AttrSelectorOperator {
  switch (operator) {
    case 'prefix-match':
      return 'prefix';
    case 'substring-match':
      return 'substring';
    case 'suffix-match':
      return 'suffix';
    case 'include-match':
      return 'includes';
    case 'dash-match':
      return 'dash-match';
    default:
      return 'equal';
  }
}

function tokenToCaseSensitivity(
  token: lightningcss.TokenOrValue,
): lightningcss.ParsedCaseSensitivity {
  assert(token.type === 'token', 'Unexpected token/value');
  assert(token.value.type === 'ident', 'Unexpected token');
  assert(token.value.value === 'i' || token.value.value === 's', 'Unexpected token');

  switch (token.value.value) {
    case 's':
      return 'explicit-case-sensitive';
    case 'i':
      return 'ascii-case-insensitive';
    default:
      throw new Error('Unexpected case sensitivity modifier');
  }
}

function tokensToAttributeSelector(
  tokens: lightningcss.TokenOrValue[],
): lightningcss.SelectorComponent {
  const first = tokens[0];
  assert(first.type === 'token', 'Unexpected token/value');

  let cursor = 0;
  let name: string;
  let namespace: lightningcss.NamespaceConstraint | null = null;

  if (first.value.type === 'delim') {
    if (first.value.value === '*') {
      // *|<ident>
      namespace = { type: 'any' };
      const delim = tokens[1];
      assert(delim.type === 'token', 'Unexpected token/value');
      assert(delim.value.type === 'delim', 'Unexpected token');
      assert(delim.value.value === '|', 'Unexpected token');
      const next = tokens[2];
      assert(next.type === 'token', 'Unexpected token/value');
      assert(next.value.type === 'ident', 'Unexpected token');
      name = next.value.value;
      cursor = 3;
    } else if (first.value.value === '|') {
      // |<ident>
      const next = tokens[1];
      assert(next.type === 'token', 'Unexpected token/value');
      assert(next.value.type === 'ident', 'Unexpected token');
      name = next.value.value;
      cursor = 2;
    } else {
      throw new Error('Unexpected delim');
    }
  } else {
    assert(first.value.type === 'ident', 'Unexpected token');
    const delim = tokens[1];
    if (delim) {
      assert(delim.type === 'token', 'Unexpected token/value');
      // <ident>|<ident>
      if (delim.value.type === 'delim' && delim.value.value === '|') {
        const next = tokens[2];
        assert(next.type === 'token', 'Unexpected token/value');
        assert(next.value.type === 'ident', 'Unexpected token');
        namespace = { type: 'specific', prefix: first.value.value, url: first.value.value };
        name = next.value.value;
        cursor = 3;
      } else {
        name = first.value.value;
        cursor = 1;
      }
    } else {
      name = first.value.value;
      cursor = 1;
    }
  }

  const operand = tokens[cursor];
  cursor += 1;
  if (!operand) {
    return {
      type: 'attribute',
      name,
      namespace,
    };
  }
  assert(operand.type === 'token', 'Unexpected token/value');
  let operation: lightningcss.AttrSelectorOperator;
  switch (operand.value.type) {
    case 'delim':
      assert(operand.value.value === '=', 'Unexpected delim');
      operation = 'equal';
      break;
    case 'dash-match':
    case 'prefix-match':
    case 'suffix-match':
    case 'include-match':
    case 'substring-match':
      operation = tokenToOperation(operand.value.type);
      break;
    default:
      throw new Error('Unexpected token');
  }
  const value = tokens[cursor];
  cursor += 1;
  assert(value.type === 'token', 'Unexpected token/value');
  assert(value.value.type === 'string' || value.value.type === 'ident', 'Unexpected token');
  const attrValue = value.value.value;
  let nextToken = tokens[cursor];
  cursor += 1;
  if (!nextToken) {
    return {
      type: 'attribute',
      name,
      namespace,
      operation: {
        caseSensitivity: namespace?.type === 'specific'
          ? 'case-sensitive'
          : 'ascii-case-insensitive-if-in-html-element-in-html-document',
        value: attrValue,
        operator: operation,
      },
    };
  }
  assert(nextToken.type === 'token', 'Unexpected token/value');
  if (nextToken.value.type === 'white-space') {
    nextToken = tokens[cursor];
    cursor += 1;
  }
  assert(nextToken.type === 'token', 'Unexpected token/value');

  return {
    type: 'attribute',
    name,
    namespace,
    operation: {
      caseSensitivity: tokenToCaseSensitivity(nextToken),
      value: attrValue,
      operator: operation,
    },
  };
}

export default function tokensToSelectorsList(
  tokens: lightningcss.TokenOrValue[],
): lightningcss.SelectorList {
  const list: lightningcss.SelectorList = [];
  let selectors: lightningcss.Selector = [];

  for (let i = 0, len = tokens.length; i < len; i += 1) {
    const token = tokens[i];

    switch (token.type) {
      case 'token':
        switch (token.value.type) {
          case 'delim':
            switch (token.value.value) {
              // Matches for both universal selector
              // and namespace selector with universal prefix
              case '*':
                // Peek
                if (i + 1 < len) {
                  const next = tokens[i + 1];
                  // Check if next token is a namespace selector
                  if (
                    next.type === 'token'
                    && next.value.type === 'delim'
                    && next.value.value === '|'
                  ) {
                    // Move for the next token
                    i += 2;
                    // Make sure that the next token is an <ident>
                    assert(i < len, 'Unexpected end of selector');
                    const id = tokens[i];
                    assert(id.type === 'token', 'Unexpected namespace selector.');
                    assert(id.value.type === 'ident', 'Unexpected namespace selector');
                    selectors.push({
                      type: 'namespace',
                      kind: 'any',
                    });
                    selectors.push({
                      type: 'type',
                      name: id.value.value,
                    });
                  } else {
                    selectors.push({
                      type: 'universal',
                    });
                  }
                } else {
                  selectors.push({
                    type: 'universal',
                  });
                }
                break;
              // Matches `|<ident>`
              case '|': {
                i += 1;
                assert(i < len, 'Unexpected end of selector');
                const next = tokens[i];
                assert(next.type === 'token', 'Unexpected class selector.');
                assert(next.value.type === 'ident', 'Unexpected class selector');
                selectors.push({
                  type: 'namespace',
                  kind: 'none',
                });
                selectors.push({
                  type: 'type',
                  name: next.value.value,
                });
              }
                break;
              // Matches <selector> + <selector>
              case '+':
                selectors.push({
                  type: 'combinator',
                  value: 'next-sibling',
                });
                break;
              // Matches <selector> > <selector>
              case '>':
                selectors.push({
                  type: 'combinator',
                  value: 'child',
                });
                break;
              // Matches <selector> ~ <selector>
              case '~':
                selectors.push({
                  type: 'combinator',
                  value: 'later-sibling',
                });
                break;
              // Matches .<ident> (class selector)
              case '.': {
                // Parse ahead
                i += 1;
                assert(i < len, 'Unexpected end of selector');
                const next = tokens[i];
                assert(next.type === 'token', 'Unexpected class selector.');
                assert(next.value.type === 'ident', 'Unexpected class selector');
                selectors.push({
                  type: 'class',
                  name: next.value.value,
                });
              }
                break;
              // A :global cannot have a comma
              case ',':
                list.push(selectors);
                selectors = [];
                break;
              default:
                break;
            }
            break;
          // Matches both type selector and
          // namespace selector with prefix (<ident>|<ident>)
          case 'ident':
            // Peek
            if (i + 1 < len) {
              const next = tokens[i + 1];
              if (
                next.type === 'token'
                && next.value.type === 'delim'
                && next.value.value === '|'
              ) {
                // Move for the next token
                i += 2;
                assert(i < len, 'Unexpected end of selector');
                const id = tokens[i];
                assert(id.type === 'token', 'Unexpected namespace selector.');
                assert(id.value.type === 'ident', 'Unexpected namespace selector');
                selectors.push({
                  type: 'namespace',
                  kind: 'named',
                  prefix: token.value.value,
                });
                selectors.push({
                  type: 'type',
                  name: id.value.value,
                });
              } else {
                selectors.push({
                  type: 'type',
                  name: token.value.value,
                });
              }
            } else {
              selectors.push({
                type: 'type',
                name: token.value.value,
              });
            }
            break;
          // Matches id selector
          case 'hash':
            selectors.push({
              type: 'id',
              name: token.value.value,
            });
            break;
          // Matches descendant combinator
          case 'white-space':
            selectors.push({
              type: 'combinator',
              value: 'descendant',
            });
            break;
          // Matches pseudo-class and pseudo-element
          case 'colon': {
            i += 1;
            assert(i < len, 'Unexpected end of selector');
            const next = tokens[i];
            if (next.type === 'token') {
              // Match pseudo-element
              if (next.value.type === 'colon') {
                i += 1;
                assert(i < len, 'Unexpected end of selector');
                const pseudoEl = tokens[i];
                if (pseudoEl.type === 'token') {
                  assert(pseudoEl.value.type === 'ident', 'Unexpected token');
                  selectors.push(
                    identTokenToPseudoElementSelector(pseudoEl.value.value as PseudoElementKind),
                  );
                } else {
                  assert(pseudoEl.type === 'function', 'Unexpected value');
                  selectors.push(functionTokenToPseudoElementSelector(pseudoEl.value));
                }
              } else {
                assert(next.value.type === 'ident', 'Unexpected token');
                selectors.push(
                  identTokenToPseudoClassSelector(next.value.value as PseudoClassKind),
                );
              }
            } else {
              assert(next.type === 'function', 'Unexpected value');
              selectors.push(functionTokenToPseudoClassSelector(next.value));
            }
          }
            break;
          case 'square-bracket-block': {
            const inner: lightningcss.TokenOrValue[] = [];
            let closed = false;
            while (i < len) {
              i += 1;
              const next = tokens[i];
              if (next.type === 'token' && next.value.type === 'close-square-bracket') {
                closed = true;
                break;
              }
              inner.push(next);
            }
            assert(closed, 'Missing close-square-bracket');
            selectors.push(tokensToAttributeSelector(inner));
          }
            break;
          default:
            break;
        }
        break;
      default:
        break;
    }
  }

  if (selectors.length) {
    list.push(selectors);
  }

  return list;
}
