# solid-styled

> Reactive stylesheets for SolidJS

[![NPM](https://img.shields.io/npm/v/solid-styled.svg)](https://www.npmjs.com/package/solid-styled)

> This branch holds solid-styled 1.0, published under the `next` tag. The 0.x line (`latest`, Solid 1.x) lives on the [`0.x`](https://github.com/lxsmnsyc/solid-styled/tree/0.x) branch and only gets fixes.

## What it is

- You write plain CSS next to your component, in a `css` tagged template or a `<style jsx>` element.
- A build plugin extracts that CSS at compile time, so almost nothing is left at runtime.
- Every selector is scoped to the component that declared it, so styles never leak.
- Interpolated values become CSS custom properties, so they stay reactive without re-rendering the sheet.
- The same sheet is inserted once, no matter how many instances of the component are mounted.

## Requirements

- `solid-js` and `@solidjs/web` `^2.0.0-rc.5`.
- Node `^20.19.0 || >=22.12.0`.
- The build plugin below. The `css` tag throws at runtime if the plugin is not installed.

## Install

```bash
npm i solid-styled
npm i -D unplugin-solid-styled
```

```bash
yarn add solid-styled
yarn add -D unplugin-solid-styled
```

```bash
pnpm add solid-styled
pnpm add -D unplugin-solid-styled
```

## Setup

```js
// vite.config.js
import solid from '@solidjs/vite-plugin';
import solidStyled from 'unplugin-solid-styled';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [solid(), solidStyled.vite()],
});
```

```jsx
import { css } from 'solid-styled';

function Title(props) {
  css`
    h1 {
      color: ${props.color};
    }
  `;

  return <h1>Hello World</h1>;
}
```

- The Vite entry moves itself ahead of the Solid plugin. With other bundlers, put it before the plugin that compiles JSX.
- `h1` only matches the `h1` written in `Title`. `props.color` becomes a CSS custom property, so the sheet stays the same when it changes.

## Docs

- [Getting started](https://github.com/lxsmnsyc/solid-styled/blob/main/docs/getting-started.md) covers requirements, install, Vite and TypeScript setup, and other bundlers.
- [Styling](https://github.com/lxsmnsyc/solid-styled/blob/main/docs/styling.md) covers `css`, `<style jsx>`, reactive values and what can be interpolated.
- [Scoping](https://github.com/lxsmnsyc/solid-styled/blob/main/docs/scoping.md) covers how scoping works, CSS nesting, `:global`, `@global`, keyframes and `use:solid-styled`.
- [SSR](https://github.com/lxsmnsyc/solid-styled/blob/main/docs/ssr.md) covers `StyleRegistry`, `renderSheets` and hydration.
- [Component libraries](https://github.com/lxsmnsyc/solid-styled/blob/main/docs/component-libraries.md) covers publishing components that use solid-styled.
- [Configuration](https://github.com/lxsmnsyc/solid-styled/blob/main/docs/configuration.md) covers plugin order, options and file filters.
- [Editor and linting](https://github.com/lxsmnsyc/solid-styled/blob/main/docs/editor.md) covers syntax highlighting, comment shortcuts and `no-unused-expressions`.
- [Migrating from 0.x](https://github.com/lxsmnsyc/solid-styled/blob/main/docs/migrating-from-0.x.md) lists the breaking changes from 0.12.x to 1.0.
- [How it works](https://github.com/lxsmnsyc/solid-styled/blob/main/docs/how-it-works.md) covers the compiler pipeline, its output and how values reach elements.
- [API reference](https://github.com/lxsmnsyc/solid-styled/blob/main/docs/api.md) covers every export of `solid-styled`, `solid-styled/compiler` and `unplugin-solid-styled`.
- [Known limits](https://github.com/lxsmnsyc/solid-styled/blob/main/docs/known-limits.md) covers unsupported setups and open bugs.

## Sponsors

![Sponsors](https://github.com/lxsmnsyc/sponsors/blob/main/sponsors.svg?raw=true)

## License

MIT © [lxsmnsyc](https://github.com/lxsmnsyc)
