import solidStyledUnplugin, { SolidStyledPluginOptions } from 'unplugin-solid-styled';
import { Plugin } from 'rollup';

export type { SolidStyledPluginFilter, SolidStyledPluginOptions } from 'unplugin-solid-styled';

const solidStyledPlugin = (
  solidStyledUnplugin.rollup as (options: SolidStyledPluginOptions) => Plugin
);

export default solidStyledPlugin;
