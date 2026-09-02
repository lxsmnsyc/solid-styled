# rollup-plugin-solid-styled

> Rollup plugin for [`solid-styled`](https://github.com/lxsmnsyc/solid-styled)

[![NPM](https://img.shields.io/npm/v/rollup-plugin-solid-styled.svg)](https://www.npmjs.com/package/rollup-plugin-solid-styled)

## Install

```bash
npm i -D rollup-plugin-solid-styled
```

```bash
yarn add -D rollup-plugin-solid-styled
```

```bash
pnpm add -D rollup-plugin-solid-styled
```

## Usage

```js
import solidStyled from 'rollup-plugin-solid-styled';

export default {
  plugins: [
    solidStyled({
      prefix: 'my-app',
      filter: {
        include: 'src/**/*.tsx',
        exclude: 'node_modules/**/*',
      },
    }),
  ],
};
```

> [!NOTE]
> Rollup has no plugin ordering hook, so put `solid-styled` before your SolidJS plugin yourself.

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
