# vite-plugin-solid-styled

> Vite plugin for [`solid-styled`](https://github.com/lxsmnsyc/solid-styled)

[![NPM](https://img.shields.io/npm/v/vite-plugin-solid-styled.svg)](https://www.npmjs.com/package/vite-plugin-solid-styled) [![JavaScript Style Guide](https://badgen.net/badge/code%20style/airbnb/ff5a5f?icon=airbnb)](https://github.com/airbnb/javascript)

## Install

```bash
npm install --D vite-plugin-solid-styled
```

```bash
yarn add -D vite-plugin-solid-styled
```

```bash
pnpm add -D vite-plugin-solid-styled
```

## Usage

```js
import solidStyled from 'vite-plugin-solid-styled';
import solid from 'vite-plugin-solid';

///...
export default {
  plugins: [
    solid(),
    solidStyled({
      prefix: 'my-prefix', // optional
      filter: {
        include: 'src/**/*.{ts,js,tsx,jsx}',
        exclude: 'node_modules/**/*.{ts,js,tsx,jsx}',
      },
    }),
  ]
}
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
