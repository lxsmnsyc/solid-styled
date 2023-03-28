import { Scope } from '@babel/traverse';
import * as t from '@babel/types';
import postcssrc from 'postcss-load-config';

export interface SolidStyledOptions {
  verbose?: boolean;
  prefix?: string;
  env?: 'development' | 'production';
}

export interface ScopedSheet {
  id: t.Identifier;
  scope: string;
  count: number;
}

export interface StateContext {
  hooks: Map<string, t.Identifier>;
  vars: WeakMap<Scope, t.Identifier>;
  sheets: WeakMap<Scope, ScopedSheet>;
  opts: SolidStyledOptions;
  ids: number;
  ns: string;
  postcss: postcssrc.Result;
}
