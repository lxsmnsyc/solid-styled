import type { Node } from './ast';
import type { Ctx } from './context';
import preprocessCSS from './preprocess-css';
import processScopedSheet from './process-scoped-sheet';

export interface DynamicTemplateResult {
  sheet: string;
  /** Object entries of the form `"--s-v-hash-N": <source expression>`. */
  variables: string[];
}

// A CSS unit written right after an interpolation, as in `${size()}px`.
// `var()` cannot be joined to a unit, so the unit is applied with `calc()`.
const UNIT_SUFFIX =
  /^(%|(?:px|em|rem|ex|ch|cap|ic|lh|rlh|vw|vh|vi|vb|vmin|vmax|svw|svh|svi|svb|svmin|svmax|lvw|lvh|lvi|lvb|lvmin|lvmax|dvw|dvh|dvi|dvb|dvmin|dvmax|cqw|cqh|cqi|cqb|cqmin|cqmax|cm|mm|q|in|pt|pc|deg|grad|rad|turn|s|ms|hz|khz|dpi|dpcm|dppx|x|fr)(?![\w-]))/i;

/**
 * Swaps every `${...}` span in the template for a generated CSS custom
 * property, so the sheet itself becomes a static string.
 */
function replaceDynamicTemplate(ctx: Ctx, template: Node): DynamicTemplateResult {
  const variables: string[] = [];
  const { quasis, expressions } = template;

  let sheet = '';
  // Length of the unit at the start of the current quasi that the previous
  // interpolation already consumed.
  let consumed = 0;

  for (let i = 0, len = quasis.length; i < len; i += 1) {
    const quasi = (quasis[i].value.cooked ?? '').slice(consumed);
    sheet = `${sheet}${quasi}`;
    consumed = 0;
    const expression = expressions[i];
    if (expression) {
      const id = `--s-${ctx.prefix(true)}${ctx.uniqueId()}`;
      const unit = UNIT_SUFFIX.exec(quasis[i + 1]?.value.cooked ?? '')?.[1];
      if (unit) {
        sheet = `${sheet}calc(var(${id}) * 1${unit})`;
        consumed = unit.length;
      } else {
        sheet = `${sheet}var(${id})`;
      }
      variables.push(`${JSON.stringify(id)}: ${ctx.code.slice(expression.start, expression.end)}`);
    }
  }

  return { sheet, variables };
}

export default function processCSSTemplate(
  ctx: Ctx,
  sheetID: string,
  template: Node,
  isScoped: boolean,
): DynamicTemplateResult {
  const { sheet, variables } = replaceDynamicTemplate(ctx, template);
  const preprocessed = preprocessCSS(ctx, sheet);
  return {
    sheet: isScoped ? preprocessCSS(ctx, processScopedSheet(sheetID, preprocessed)) : preprocessed,
    variables,
  };
}
