/* eslint-disable object-shorthand */
import * as lightningcss from 'lightningcss';
import browserslist from 'browserslist';
import { StateContext } from '../types';
import { GLOBAL_SELECTOR, SOLID_STYLED_NS } from './constants';
import tokensToSelectorsList from './token-to-selector';

export default function processScopedSheet(
  ctx: StateContext,
  sheetID: string,
  content: string,
) {
  const keyframes = new Set();

  // Flag to indicate that the currently visited
  // node is inside a global block
  let inGlobal = 0;
  let inKeyframes = false;

  const { code: keyframe } = lightningcss.transform({
    code: Buffer.from(content),
    filename: ctx.ns,
    minify: true,
    targets: lightningcss.browserslistToTargets(browserslist(ctx.opts.browserslist || 'defaults')),
    drafts: {
      nesting: true,
      customMedia: true,
    },
    customAtRules: {
      global: {
        body: 'rule-list',
      },
    },
    visitor: {
      Rule: {
        custom: {
          global() {
            inGlobal += 1;
          },
        },
        keyframes(rule) {
          if (inGlobal > 0) {
            keyframes.add(rule.value.name.value);
            return {
              type: 'keyframes',
              value: {
                ...rule.value,
                name: {
                  type: rule.value.name.type,
                  value: `${sheetID}-${rule.value.name.value}`,
                },
              },
            };
          }
          return undefined;
        },
      },
      RuleExit: {
        custom: {
          global() {
            inGlobal -= 1;
          },
        },
      },
    },
  });

  inGlobal = 0;

  // This selector is going to be inserted
  // on every non-global selector
  // [s\:${sheetID}]
  const special: lightningcss.SelectorComponent = {
    type: 'attribute',
    name: `${SOLID_STYLED_NS}:${sheetID}`,
  };

  const { code } = lightningcss.transform({
    code: keyframe,
    filename: ctx.ns,
    minify: true,
    targets: lightningcss.browserslistToTargets(browserslist(ctx.opts.browserslist || 'defaults')),
    customAtRules: {
      global: {
        body: 'rule-list',
      },
    },
    visitor: {
      Rule: {
        custom: {
          global() {
            inGlobal += 1;
          },
        },
        keyframes() {
          inKeyframes = false;
        },
      },
      RuleExit: {
        custom: {
          global(rule) {
            inGlobal -= 1;
            return rule.body;
          },
        },
        keyframes() {
          inKeyframes = true;
        },
      },
      Declaration: {
        animation(rule) {
          if (rule.property === 'animation' && inGlobal === 0 && Array.isArray(rule.value)) {
            const animations: lightningcss.Animation[] = [];
            for (let i = 0, len = rule.value.length; i < len; i += 1) {
              const animation = rule.value[i];
              switch (animation.name.type) {
                case 'ident':
                case 'string':
                  if (keyframes.has(animation.name.value)) {
                    animations.push({
                      ...animation,
                      name: {
                        ...animation.name,
                        value: `${sheetID}-${animation.name.value}`,
                      },
                    });
                  } else {
                    animations.push(animation);
                  }
                  break;
                case 'none':
                  animations.push(animation);
                  break;
                default:
                  break;
              }
            }
            return {
              ...rule,
              value: animations,
            };
          }
          return undefined;
        },
        'animation-name'(rule) {
          if (rule.property === 'animation-name' && inGlobal === 0) {
            const names: lightningcss.AnimationName[] = [];
            for (let i = 0, len = rule.value.length; i < len; i += 1) {
              const name = rule.value[i];
              switch (name.type) {
                case 'ident':
                case 'string':
                  if (keyframes.has(name.value)) {
                    names.push({
                      ...name,
                      value: `${sheetID}-${name.value}`,
                    });
                  } else {
                    names.push(name);
                  }
                  break;
                case 'none':
                  names.push(name);
                  break;
                default:
                  break;
              }
            }
            return {
              ...rule,
              value: names,
            };
          }
          return undefined;
        },
      },
      Selector(rule) {
        if (inKeyframes || inGlobal !== 0) {
          return undefined;
        }
        const selectors: lightningcss.Selector = [];

        let shouldPush = true;

        for (let i = 0, len = rule.length; i < len; i += 1) {
          const selector = rule[i];

          switch (selector.type) {
            // Push the selector after the node
            case 'universal':
            case 'type':
            case 'class':
            case 'id':
            case 'attribute':
              selectors.push(selector);
              if (shouldPush) {
                selectors.push(special);
                shouldPush = false;
              }
              break;
            // Push the selector before the node
            case 'pseudo-element':
              if (shouldPush) {
                selectors.push(special);
                shouldPush = false;
              }
              selectors.push(selector);
              break;
            // Not a selector
            case 'combinator':
            case 'namespace':
            case 'nesting':
              selectors.push(selector);
              shouldPush = true;
              break;
            case 'pseudo-class':
              // `:global`
              if (selector.kind === 'custom-function' && selector.name === GLOBAL_SELECTOR) {
                selectors.push(...tokensToSelectorsList(selector.arguments)[0]);
              } else {
                if (shouldPush) {
                  selectors.push(special);
                  shouldPush = false;
                }
                selectors.push(selector);
              }
              break;
            default:
              break;
          }
        }

        return selectors;
      },
    },
  });

  return code.toString('utf-8');
}
