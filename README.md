# solid-styled

> Reactive stylesheets for SolidJS

[![NPM](https://img.shields.io/npm/v/solid-styled.svg)](https://www.npmjs.com/package/solid-styled)

## What it is

- You write plain CSS next to your component, in a `css` tagged template or a `<style jsx>` element.
- A build plugin extracts that CSS at compile time, so almost nothing is left at runtime.
- Every selector is scoped to the component that declared it, so styles never leak.
- Interpolated values become CSS custom properties, so they stay reactive without re-rendering the sheet.
- The same sheet is inserted once, no matter how many instances of the component are mounted.

## Requirements

- SolidJS 2.0 or newer, along with `@solidjs/web`.
- One of the build integrations below. The `css` tag throws at runtime if the plugin is not installed.

## Install

```bash
npm i solid-styled
npm i -D vite-plugin-solid-styled
```

```bash
yarn add solid-styled
yarn add -D vite-plugin-solid-styled
```

```bash
pnpm add solid-styled
pnpm add -D vite-plugin-solid-styled
```

## Setup

Add the plugin before the Solid plugin so it sees your JSX before it is compiled away.

```js
// vite.config.js
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

Other integrations:

- [Vite](https://github.com/lxsmnsyc/solid-styled/tree/main/packages/vite)
- [Rollup](https://github.com/lxsmnsyc/solid-styled/tree/main/packages/rollup)
- [Unplugin](https://github.com/lxsmnsyc/solid-styled/tree/main/packages/unplugin), for every other bundler

## Docs

- [Setup](https://github.com/lxsmnsyc/solid-styled/tree/main/docs/setup.md) covers plugin options and TypeScript types.
- [Styling](https://github.com/lxsmnsyc/solid-styled/tree/main/docs/styling.md) covers `css`, `<style jsx>` and reactive values.
- [Scoping](https://github.com/lxsmnsyc/solid-styled/tree/main/docs/scoping.md) covers `:global`, `@global` and `use:solid-styled`.
- [SSR](https://github.com/lxsmnsyc/solid-styled/tree/main/docs/ssr.md) covers `StyleRegistry` and `renderSheets`.
- [How it works](https://github.com/lxsmnsyc/solid-styled/tree/main/docs/how-it-works.md) covers the compiler output.

## Usage

### `css`

Call `css` as a statement inside your component. The template is a normal stylesheet.

```jsx
import { css } from 'solid-styled';

function Title() {
  css`
    h1 {
      color: red;
    }
  `;

  return <h1>Hello World</h1>;
}
```

Interpolated values are replaced by CSS custom properties, so the sheet itself is static and only the variable changes.

```jsx
import { createSignal } from 'solid-js';
import { css } from 'solid-styled';

function Button() {
  const [color, setColor] = createSignal('red');

  css`
    button {
      color: ${color()};
    }
  `;

  return (
    <button onClick={() => setColor((c) => (c === 'red' ? 'blue' : 'red'))}>
      Current color: {color()}
    </button>
  );
}
```

### `<style jsx>`

`<style jsx>` does exactly what `css` does, written inside JSX instead.

```jsx
function Button() {
  const [color, setColor] = createSignal('red');

  return (
    <>
      <style jsx>
        {`
          button {
            color: ${color()};
          }
        `}
      </style>
      <button onClick={() => setColor((c) => (c === 'red' ? 'blue' : 'red'))}>
        Current color: {color()}
      </button>
    </>
  );
}
```

Use `<style jsx global>` to declare global styles.

### Scoping

Styles apply to the DOM elements written inside the component, including elements passed as children to other components. They do not apply to elements rendered by another component.

```jsx
function ForeignTitle() {
  return <h1>This is not affected</h1>;
}

function Title() {
  css`
    h1 {
      color: red;
    }
  `;

  return (
    <>
      <h1>This is affected.</h1>
      <ForeignTitle />
      <Container>
        <h1>This is also affected.</h1>
      </Container>
    </>
  );
}
```

Use `:global(...)` for a single selector, `@global { ... }` for a block, and `use:solid-styled` to forward the scope to a component. See [Scoping](https://github.com/lxsmnsyc/solid-styled/tree/main/docs/scoping.md).

### SSR

Wrap the tree in `<StyleRegistry>` and render the collected sheets into your HTML. See [SSR](https://github.com/lxsmnsyc/solid-styled/tree/main/docs/ssr.md).

## CSS processing

- Sheets are compiled with [LightningCSS](https://lightningcss.dev/), so they are minified and lowered for your browser targets.
- CSS nesting, modern color syntax and custom media queries are always lowered.
- Set the `browserslist` plugin option to control the targets.

## Limitations

- Scoped `css` must be called directly inside a component, so the compiler can find the JSX it belongs to.
- Global `css` (through `:global` or `@global`) can be called from any function, including hooks.
- Interpolated values can only be used as CSS values, not as selectors or property names.
- A component that declares reactive values needs a block body, because the compiler declares a variable holder at the top of it.

## Sponsors

![Sponsors](https://github.com/lxsmnsyc/sponsors/blob/main/sponsors.svg?raw=true)

## License

MIT © [lxsmnsyc](https://github.com/lxsmnsyc)
