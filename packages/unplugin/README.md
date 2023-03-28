# unplugin-solid-styled

> [Unplugin](https://github.com/unjs/unplugin) for [`solid-styled`](https://github.com/lxsmnsyc/solid-styled)

[![NPM](https://img.shields.io/npm/v/unplugin-solid-styled.svg)](https://www.npmjs.com/package/unplugin-solid-styled) [![JavaScript Style Guide](https://badgen.net/badge/code%20style/airbnb/ff5a5f?icon=airbnb)](https://github.com/airbnb/javascript)

## Install

```bash
npm install --D unplugin-solid-styled
```

```bash
yarn add -D unplugin-solid-styled
```

```bash
pnpm add -D unplugin-solid-styled
```

## Usage

Please check out [`unplugin`](https://github.com/unjs/unplugin) to know more about how to use the plugins with `unplugin-thaler` in your target bundler.

```js
import solidStyled from 'unplugin-solid-styled';

/// Example: Vite
solidStyled.vite({
  prefix: 'my-prefix',
  filter: {
    include: 'src/**/*.{ts,js,tsx,jsx}',
    exclude: 'node_modules/**/*.{ts,js,tsx,jsx}',
  },
}),
```

## Config options

```js
{
  // Toggle verbose scope names based
  // on the owning component's name,
  // useful for debugging
  // Default: false
  "verbose": true,

  // Allows prefixing scope names
  // useful for package publishing
  // Default: undefined ('')
  "prefix": "example",
}
```

## Sponsors

![Sponsors](https://github.com/lxsmnsyc/sponsors/blob/main/sponsors.svg?raw=true)

## License

MIT © [lxsmnsyc](https://github.com/lxsmnsyc)
