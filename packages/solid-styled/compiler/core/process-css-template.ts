import * as t from '@babel/types';
import type { StateContext } from '../types';
import preprocessCSS from './preprocess-css';
import processScopedSheet from './process-scoped-sheet';
import { getPrefix, getUniqueId } from './utils';

interface DynamicTemplateResult {
  sheet: string;
  variables: t.ObjectProperty[];
}

function replaceDynamicTemplate(
  ctx: StateContext,
  { expressions, quasis }: t.TemplateLiteral,
): DynamicTemplateResult {
  // Collects all the variables
  const variables: t.ObjectProperty[] = [];

  let sheet = '';
  let currentExpr = 0;

  for (let i = 0, len = quasis.length; i < len; i += 1) {
    sheet = `${sheet}${quasis[i].value.cooked ?? ''}`;
    if (currentExpr < expressions.length) {
      const expr = expressions[currentExpr];
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
    sheet,
    variables,
  };
}

export default function processCSSTemplate(
  ctx: StateContext,
  sheetID: string,
  templateLiteral: t.TemplateLiteral,
  isScoped: boolean,
): DynamicTemplateResult {
  // Replace the template's dynamic parts with CSS variables
  const { sheet, variables } = replaceDynamicTemplate(ctx, templateLiteral);
  return {
    sheet: isScoped
      ? processScopedSheet(ctx, sheetID, sheet)
      : preprocessCSS(ctx, sheet),
    variables,
  };
}
