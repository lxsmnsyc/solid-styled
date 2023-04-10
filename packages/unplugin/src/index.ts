import { compile, SolidStyledOptions } from 'solid-styled/compiler';
import { Plugin } from 'vite';
import { createFilter, FilterPattern } from '@rollup/pluginutils';
import { createUnplugin } from 'unplugin';

export interface SolidStyledPluginFilter {
  include?: FilterPattern;
  exclude?: FilterPattern;
}

export interface SolidStyledPluginOptions extends SolidStyledOptions {
  filter?: SolidStyledPluginFilter;
}

// From: https://github.com/bluwy/whyframe/blob/master/packages/jsx/src/index.js#L27-L37
function repushPlugin(plugins: Plugin[], pluginName: string, pluginNames: string[]) {
  const namesSet = new Set(pluginNames);

  let baseIndex = -1;
  let targetIndex = -1;
  let targetPlugin: Plugin;
  for (let i = 0, len = plugins.length; i < len; i += 1) {
    const current = plugins[i];
    if (namesSet.has(current.name) && baseIndex === -1) {
      baseIndex = i;
    }
    if (current.name === pluginName) {
      targetIndex = i;
      targetPlugin = current;
    }
  }
  if (baseIndex !== -1 && targetIndex !== -1 && baseIndex < targetIndex) {
    plugins.splice(targetIndex, 1);
    plugins.splice(baseIndex, 0, targetPlugin!);
  }
}

const DEFAULT_INCLUDE = 'src/**/*.{jsx,tsx,ts,js,mjs,cjs}';
const DEFAULT_EXCLUDE = 'node_modules/**/*.{jsx,tsx,ts,js,mjs,cjs}';

const solidStyledPlugin = createUnplugin((options: SolidStyledPluginOptions = {}) => {
  const filter = createFilter(
    options.filter?.include || DEFAULT_INCLUDE,
    options.filter?.exclude || DEFAULT_EXCLUDE,
  );

  let env: SolidStyledOptions['env'];

  return {
    name: 'solid-styled',
    transformInclude(id) {
      return filter(id);
    },
    transform(code, id) {
      return compile(id, code, {
        ...options,
        env,
      });
    },
    vite: {
      enforce: 'pre',
      configResolved(config) {
        env = config.mode !== 'production' ? 'development' : 'production';

        // run our plugin before the following plugins:
        repushPlugin(config.plugins as Plugin[], 'solid-styled', [
          // https://github.com/withastro/astro/blob/main/packages/astro/src/vite-plugin-jsx/index.ts#L173
          'astro:jsx',
          // https://github.com/solidjs/vite-plugin-solid/blob/master/src/index.ts#L305
          'solid',
        ]);
      },
    },
  };
});

export default solidStyledPlugin;
