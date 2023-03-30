import solidStyledUnplugin, { SolidStyledPluginOptions } from 'unplugin-solid-styled';
import { Plugin } from 'vite';

export type { SolidStyledPluginFilter, SolidStyledPluginOptions } from 'unplugin-solid-styled';

const solidStyledPlugin = solidStyledUnplugin.vite as (options: SolidStyledPluginOptions) => Plugin;

export default solidStyledPlugin;
