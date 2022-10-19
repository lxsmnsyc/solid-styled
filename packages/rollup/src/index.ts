import solidStyledBabel from 'solid-styled/babel';
import { Plugin } from 'rollup';
import { createFilter, FilterPattern } from '@rollup/pluginutils';
import * as babel from '@babel/core';
import path from 'path';
import ts from '@babel/preset-typescript';

export interface SolidStyledPluginFilter {
  include?: FilterPattern;
  exclude?: FilterPattern;
}

export interface SolidStyledPluginOptions {
  verbose?: boolean;
  prefix?: string;
  filter?: SolidStyledPluginFilter;
  babel?: babel.TransformOptions;
}

export default function solidStyledPlugin(
  options: SolidStyledPluginOptions = {},
): Plugin {
  const filter = createFilter(
    options.filter?.include,
    options.filter?.exclude,
  );
  return {
    name: 'solid-styled',
    async transform(code, id) {
      if (filter(id)) {
        const result = await babel.transformAsync(code, {
          ...options.babel,
          presets: [
            [ts],
            ...(options.babel?.presets ?? []),
          ],
          plugins: [
            [solidStyledBabel, {
              verbose: options.verbose,
              prefix: options.prefix,
              source: id,
            }],
            ...(options.babel?.plugins ?? []),
          ],
          filename: path.basename(id),
        });

        if (result) {
          return {
            code: result.code ?? '',
            map: result.map,
          };
        }
      }
      return undefined;
    },
  };
}
