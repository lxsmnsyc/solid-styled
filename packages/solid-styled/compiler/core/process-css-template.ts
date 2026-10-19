import type { Node } from './ast';
import type { Ctx } from './context';
import preprocessCSS from './preprocess-css';
import processScopedSheet from './process-scoped-sheet';

export interface DynamicTemplateResult {
  sheet: string;
  /** Object entries of the form `"--s-v-hash-N": <source expression>`. */
  variables: string[];
}

/**
 * Swaps every `${...}` span in the template for a generated CSS custom
 * property, so the sheet itself becomes a static string.
 */
function replaceDynamicTemplate(ctx: Ctx, template: Node): DynamicTemplateResult {
  const variables: string[] = [];
  const { quasis, expressions } = template;

  let sheet = '';

  for (let i = 0, len = quasis.length; i < len; i += 1) {
    sheet = `${sheet}${quasis[i].value.cooked ?? ''}`;
    const expression = expressions[i];
    if (expression) {
      const id = `--s-${ctx.prefix(true)}${ctx.uniqueId()}`;
      sheet = `${sheet}var(${id})`;
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
