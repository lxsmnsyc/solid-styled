import browserslist from 'browserslist';
import * as lightningcss from 'lightningcss';
import type { StateContext } from '../types';

export default function preprocessCSS(
  ctx: StateContext,
  content: string,
): string {
  const { code } = lightningcss.transform({
    code: Buffer.from(content),
    filename: ctx.ns,
    minify: true,
    targets: lightningcss.browserslistToTargets(
      browserslist(ctx.opts.browserslist || 'defaults'),
    ),
    include:
      lightningcss.Features.Nesting |
      lightningcss.Features.Colors |
      lightningcss.Features.CustomMediaQueries,
  });

  return new TextDecoder().decode(code);
}
