import type * as babel from '@babel/core';
import { addNamed } from '@babel/helper-module-imports';
import type * as t from '@babel/types';
import type { StateContext } from '../types';

export default function getImportIdentifier(
  ctx: StateContext,
  path: babel.NodePath,
  source: string,
  name: string,
): t.Identifier {
  const target = `${source}[${name}]`;
  const current = ctx.hooks.get(target);
  if (current) {
    return current;
  }
  const newID = addNamed(path, name, source);
  ctx.hooks.set(target, newID);
  return newID;
}
