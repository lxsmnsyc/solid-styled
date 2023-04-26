import * as t from '@babel/types';
import type { StateContext } from '../types';
import preprocessCSS from './preprocess-css';
import processScopedSheet from './process-scoped-sheet';
import { getPrefix, getUniqueId } from './utils';

interface ProcessedCSSTemplate {
  sheet: string;
  variables: t.ObjectProperty[];
}

export default function processCSSTemplate(
  ctx: StateContext,
  sheetID: string,
  template: t.TemplateLiteral,
  isScoped: boolean,
): ProcessedCSSTemplate {
  // Replace the template's dynamic parts with CSS variables
  // Collects all the variables
  const variables: t.ObjectProperty[] = [];

  let sheet = '';
  let currentExpr = 0;

  for (let i = 0, len = template.quasis.length; i < len; i += 1) {
    sheet = `${sheet}${template.quasis[i].value.cooked ?? ''}`;
    if (currentExpr < template.expressions.length) {
      const expr = template.expressions[currentExpr];
      if (t.isExpression(expr)) {
        // Create a new variable
        const id = `--s-${getPrefix(ctx, true)}${getUniqueId(ctx)}`;
        // Push the variable access
        sheet = `${sheet}var(${id})`;
        // Register the variable and its expression
        variables.push(t.objectProperty(
          t.stringLiteral(id),
          expr,
        ));
        currentExpr += 1;
      }
    }
  }

  return {
    sheet: isScoped
      ? processScopedSheet(ctx, sheetID, sheet)
      : preprocessCSS(ctx, sheet),
    variables,
  };
}
