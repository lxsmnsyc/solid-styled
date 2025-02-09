import type { NodePath } from '@babel/traverse';
import type * as t from '@babel/types';

export interface SolidStyledOptions {
  verbose?: boolean;
  prefix?: string;
  env?: 'development' | 'production';
  browserslist?: string;
}

export interface ScopedSheet {
  id: t.Identifier;
  scope: string;
  count: number;
}

export interface StateContext {
  hooks: Map<string, t.Identifier>;
  vars: WeakMap<NodePath, t.Identifier>;
  sheets: WeakMap<NodePath, ScopedSheet>;
  opts: SolidStyledOptions;
  ids: number;
  ns: string;
}
