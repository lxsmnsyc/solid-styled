# unplugin-solid-styled

> [Unplugin](https://github.com/unjs/unplugin) for [`solid-styled`](https://github.com/lxsmnsyc/solid-styled)

[![NPM](https://img.shields.io/npm/v/unplugin-solid-styled.svg)](https://www.npmjs.com/package/unplugin-solid-styled)

## Install

```bash
npm i -D unplugin-solid-styled
```

```bash
yarn add -D unplugin-solid-styled
```

```bash
pnpm add -D unplugin-solid-styled
```

## Usage

Pick the entry point for your bundler. See [`unplugin`](https://github.com/unjs/unplugin) for the full list.

```js
import solidStyled from 'unplugin-solid-styled';

const options = {
  prefix: 'my-app',
  filter: {
    include: 'src/**/*.tsx',
    exclude: 'node_modules/**/*',
  },
};

solidStyled.vite(options);
solidStyled.rollup(options);
solidStyled.webpack(options);
solidStyled.esbuild(options);
```

The Vite entry sets `enforce: 'pre'` and moves itself ahead of the `solid` plugin. For every other bundler, make sure `solid-styled` runs before the SolidJS JSX transform.

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
