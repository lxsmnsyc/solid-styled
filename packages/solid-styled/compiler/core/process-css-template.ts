import * as t from '@babel/types';
import * as csstree from 'css-tree';
import { StateContext } from '../types';
import processPostCSS from './process-postcss';
import processScopedSheet from './process-scoped-sheet';
import { getPrefix, getUniqueId } from './utils';

function replaceDynamicTemplate(
  ctx: StateContext,
  { expressions, quasis }: t.TemplateLiteral,
) {
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
) {
  // Replace the template's dynamic parts with CSS variables
  const { sheet, variables } = replaceDynamicTemplate(ctx, templateLiteral);
  const processed = processPostCSS(ctx, sheet);
  const ast = csstree.parse(processed);

  if (isScoped) {
    processScopedSheet(sheetID, ast);
  }

  const compiledSheet = csstree.generate(ast);

  return {
    sheet: compiledSheet,
    variables,
  };
}
