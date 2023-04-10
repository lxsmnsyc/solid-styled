import babel from '@babel/core';
import path from 'path';
import { SolidStyledOptions, StateContext } from './types';
import xxHash32 from './xxhash32';
import solidStyledPlugin from './plugin';

export {
  SolidStyledOptions,
};

export async function compile(
  id: string,
  code: string,
  options: SolidStyledOptions,
) {
  const ctx: StateContext = {
    hooks: new Map(),
    sheets: new WeakMap(),
    vars: new WeakMap(),
    opts: options,
    ns: xxHash32(id).toString(16),
    ids: 0,
  };
  const plugins: NonNullable<NonNullable<babel.TransformOptions['parserOpts']>['plugins']> = ['jsx'];
  if (/\.[mc]?tsx?$/i.test(id)) {
    plugins.push('typescript');
  }
  const result = await babel.transformAsync(code, {
    plugins: [
      [solidStyledPlugin, ctx],
    ],
    parserOpts: {
      plugins,
    },
    filename: path.basename(id),
    ast: false,
    sourceMaps: true,
    configFile: false,
    babelrc: false,
    sourceFileName: id,
  });

  if (result) {
    return {
      code: result.code || '',
      map: result.map,
    };
  }
  throw new Error('invariant');
}
