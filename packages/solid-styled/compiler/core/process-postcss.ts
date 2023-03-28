import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import postcssNested from 'postcss-nested';
import postcssSafeParser from 'postcss-safe-parser';
import { StateContext } from '../types';

export default function processPostCSS(
  ctx: StateContext,
  content: string,
) {
  const result = postcss([
    cssnano({
      plugins: [
        autoprefixer,
        postcssNested,
        ...ctx.postcss.plugins,
      ],
    }),
  ]);
  const processed = result.process(content, {
    from: ctx.ns,
    parser: postcssSafeParser,
  });
  return processed.css;
}
