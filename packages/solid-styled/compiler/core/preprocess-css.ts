import browserslist from 'browserslist';
import * as lightningcss from 'lightningcss';
import type { Node } from './ast';
import type { Ctx } from './context';

function transformCSS(ctx: Ctx, content: string): string {
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

/**
 * Runs the sheet through lightningcss: nesting, colors and custom media.
 * A CSS error is rethrown as a `CompileError` located at the template.
 */
export default function preprocessCSS(ctx: Ctx, content: string, template: Node): string {
  try {
    return transformCSS(ctx, content);
  } catch (error) {
    if (error instanceof Error) {
      return ctx.error(template, error.message);
    }
    throw error;
  }
}
