import type { SolidStyledPluginOptions } from 'unplugin-solid-styled';
import solidStyledUnplugin from 'unplugin-solid-styled';
import type { Plugin } from 'rollup';

export type {
  SolidStyledPluginFilter,
  SolidStyledPluginOptions,
} from 'unplugin-solid-styled';

const solidStyledPlugin = solidStyledUnplugin.rollup as (
  options: SolidStyledPluginOptions,
) => Plugin;

export default solidStyledPlugin;
