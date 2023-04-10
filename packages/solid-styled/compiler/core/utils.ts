import { StateContext } from '../types';

export function getUniqueId(ctx: StateContext) {
  const currentID = ctx.ids;
  ctx.ids += 1;
  return `${ctx.ns}-${currentID}`;
}

export function getPrefix(ctx: StateContext, isVar = false) {
  const defaultPrefix = isVar ? 'v-' : 'c-';
  return ctx.opts.prefix ? `${ctx.opts.prefix}-` : defaultPrefix;
}
