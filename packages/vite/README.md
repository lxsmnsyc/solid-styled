# vite-plugin-solid-styled

> Vite plugin for [`solid-styled`](https://github.com/lxsmnsyc/solid-styled)

[![NPM](https://img.shields.io/npm/v/vite-plugin-solid-styled.svg)](https://www.npmjs.com/package/vite-plugin-solid-styled)

## Install

```bash
npm i -D vite-plugin-solid-styled
```

```bash
yarn add -D vite-plugin-solid-styled
```

```bash
pnpm add -D vite-plugin-solid-styled
```

## Usage

```js
import solid from '@solidjs/vite-plugin';
import solidStyled from 'vite-plugin-solid-styled';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    solid(),
    solidStyled({
      prefix: 'my-app',
      filter: {
        include: 'src/**/*.tsx',
        exclude: 'node_modules/**/*',
      },
    }),
  ],
});
```

The plugin sets `enforce: 'pre'` and moves itself ahead of the `solid` plugin, so the order you write them in does not matter.

## Options

- `verbose` puts the component name into the generated scope, which helps while debugging. Defaults to `false`.
- `prefix` replaces the default `c-` and `v-` prefixes of generated names. Useful when publishing a component library.
- `browserslist` sets the browser targets LightningCSS lowers the sheet for. Defaults to `'defaults'`.
- `filter.include` and `filter.exclude` choose the files to compile.

See [the docs](https://github.com/lxsmnsyc/solid-styled/tree/main/docs/setup.md) for the full list.

## Sponsors

![Sponsors](https://github.com/lxsmnsyc/sponsors/blob/main/sponsors.svg?raw=true)

## License

MIT © [lxsmnsyc](https://github.com/lxsmnsyc)
