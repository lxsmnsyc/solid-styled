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
    targets: lightningcss.browserslistToTargets(browserslist(ctx.opts.browserslist || 'defaults')),
    drafts: {
      nesting: true,
      customMedia: true,
    },
  });

  return code.toString('utf-8');
}
