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

const DEFAULT_INCLUDE = 'src/**/*.{jsx,tsx,ts,js,mjs,cjs}';
const DEFAULT_EXCLUDE = 'node_modules/**/*.{jsx,tsx,ts,js,mjs,cjs}';

export default function solidStyledPlugin(
  options: SolidStyledPluginOptions = {},
): Plugin {
  const filter = createFilter(
    options.filter?.include || DEFAULT_INCLUDE,
    options.filter?.exclude || DEFAULT_EXCLUDE,
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
