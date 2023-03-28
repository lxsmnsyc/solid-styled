import postcss from 'postcss';
import postcssSafeParser from 'postcss-safe-parser';
import { StateContext } from '../types';

export default function processPostCSS(
  ctx: StateContext,
  content: string,
) {
  const result = postcss(ctx.postcss.plugins);
  const processed = result.process(content, {
    from: ctx.ns,
    parser: postcssSafeParser,
  });
  return processed.css;
}
