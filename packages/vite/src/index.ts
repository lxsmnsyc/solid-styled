import solidStyledBabel from 'solid-styled/babel';
import { Plugin } from 'vite';
import { createFilter, FilterPattern } from '@rollup/pluginutils';
import * as babel from '@babel/core';
import path from 'path';
import ts from '@babel/preset-typescript';

export interface SolidStyledPluginFilter {
  include?: FilterPattern;
  exclude?: FilterPattern;
}

export interface SolidStyledPluginOptions {
  prefix?: string;
  filter?: SolidStyledPluginFilter;
  babel?: babel.TransformOptions;
}

// From: https://github.com/bluwy/whyframe/blob/master/packages/jsx/src/index.js#L27-L37
function repushPlugin(plugins: Plugin[], plugin: Plugin, pluginNames: string[]) {
  const namesSet = new Set(pluginNames);

  let baseIndex = -1;
  let solidStyledIndex = -1;
  for (let i = 0, len = plugins.length; i < len; i += 1) {
    const current = plugins[i];
    if (namesSet.has(current.name) && baseIndex === -1) {
      baseIndex = i;
    }
    if (current.name === 'solid-styled') {
      solidStyledIndex = i;
    }
  }
  if (baseIndex !== -1 && solidStyledIndex !== -1) {
    plugins.splice(solidStyledIndex, 1);
    plugins.splice(baseIndex, 0, plugin);
  }
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
  let isDev = false;
  const plugin: Plugin = {
    name: 'solid-styled',
    enforce: 'pre',
    configResolved(config) {
      isDev = config.mode !== 'production';

      // run our plugin before the following plugins:
      repushPlugin(config.plugins as Plugin[], plugin, [
        // https://github.com/withastro/astro/blob/main/packages/astro/src/vite-plugin-jsx/index.ts#L173
        'astro:jsx',
        // https://github.com/solidjs/vite-plugin-solid/blob/master/src/index.ts#L305
        'solid',
      ]);
    },
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
              verbose: isDev,
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

  return plugin;
}
