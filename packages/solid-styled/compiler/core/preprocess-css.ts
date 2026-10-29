import browserslist from 'browserslist';
import * as lightningcss from 'lightningcss';
import type { Ctx } from './context';

/** Runs the sheet through lightningcss: nesting, colors and custom media. */
export default function preprocessCSS(ctx: Ctx, content: string): string {
  const { code } = lightningcss.transform({
    code: new TextEncoder().encode(content),
    filename: ctx.ns,
    minify: true,
    targets: lightningcss.browserslistToTargets(browserslist(ctx.opts.browserslist ?? 'defaults')),
    include:
      lightningcss.Features.Nesting |
      lightningcss.Features.Colors |
      lightningcss.Features.CustomMediaQueries,
  });

  return new TextDecoder().decode(code);
}
