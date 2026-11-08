# Getting started

## Requirements

- `solid-js` and `@solidjs/web` `^2.0.0-rc.5`. solid-styled 1.0 targets Solid 2.0. For Solid 1.x, use the [`0.x`](https://github.com/lxsmnsyc/solid-styled/tree/0.x) line.
- Node `^20.19.0 || >=22.12.0`.
- A bundler that runs `unplugin-solid-styled`. With Vite, version 8 or newer.
- The `css` tag throws at runtime if the plugin did not compile the module.

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

## Vite setup

```js
// vite.config.js
import solid from '@solidjs/vite-plugin';
import solidStyled from 'unplugin-solid-styled';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    solid(),
    solidStyled.vite({
      prefix: 'my-app',
    }),
  ],
});
```

- `solidStyled.vite()` moves itself ahead of the Solid plugin, so the order in `plugins` does not matter. See [Plugin order](./configuration.md#plugin-order).
- By default the plugin compiles `src/**/*.{jsx,tsx,ts,js,mjs,cjs}`. See [Configuration](./configuration.md) for the options.

## TypeScript

Add the package types so `<style jsx>`, `<style jsx global>` and `use:solid-styled` type check. Either add a reference in a `.d.ts` file:

```ts
/// <reference types="solid-styled" />
```

Or add `solid-styled` to `compilerOptions.types` in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["solid-styled"]
  }
}
```

## A first component

```jsx
import { createSignal } from 'solid-js';
import { css } from 'solid-styled';

export default function Counter() {
  const [count, setCount] = createSignal(0);

  css`
    button {
      color: ${count() % 2 === 0 ? 'red' : 'blue'};
      padding: 0.5rem 1rem;
    }
  `;

  return <button onClick={() => setCount((c) => c + 1)}>Count: {count()}</button>;
}
```

- The `button` selector only matches buttons written in `Counter`. See [Scoping](./scoping.md).
- The color is a CSS custom property, so the sheet stays the same when `count` changes. See [Styling](./styling.md#reactive-values).

## Other bundlers

`unplugin-solid-styled` is an [unplugin](https://github.com/unjs/unplugin), so it has an entry per bundler.

```js
import solidStyled from 'unplugin-solid-styled';

solidStyled.rollup(options);
solidStyled.webpack(options);
solidStyled.esbuild(options);
```

- Only the Vite entry reorders itself. With every other bundler, put `solid-styled` before the plugin that compiles JSX.
- The full list of entries is in the [API reference](./api.md#unplugin-solid-styled).

## Next steps

- [Styling](./styling.md) covers `css`, `<style jsx>` and reactive values.
- [Scoping](./scoping.md) covers `:global`, `@global`, nesting and `use:solid-styled`.
- [SSR](./ssr.md) covers `StyleRegistry` and `renderSheets`.
- [Component libraries](./component-libraries.md) covers publishing styled components.
- [Configuration](./configuration.md) covers the plugin options.
