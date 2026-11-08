# Setup

## Plugin order

- `solid-styled` must run before the SolidJS JSX transform, because it rewrites JSX attributes.
- The Vite entry sets `enforce: 'pre'` and moves itself ahead of the `solid` plugin for you.
- With every other bundler, put `solid-styled` first in the `plugins` array yourself.

## Options

Every bundler entry takes the same options.

| Option           | Type                 | Default                                       | What it does                                                                                                                                 |
| ---------------- | -------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `verbose`        | `boolean`            | `false`                                       | Puts the component name into the generated scope, which makes the DOM easier to read while debugging.                                        |
| `prefix`         | `string`             | `undefined`                                   | Replaces the default `c-` and `v-` prefixes of generated names. Use it when you publish a styled component library, so scopes never collide. |
| `browserslist`   | `string`             | `'defaults'`                                  | The browser targets LightningCSS lowers the sheet for.                                                                                       |
| `filter.include` | `string \| string[]` | `'src/**/*.{jsx,tsx,ts,js,mjs,cjs}'`          | Files the plugin compiles.                                                                                                                   |
| `filter.exclude` | `string \| string[]` | `'node_modules/**/*.{jsx,tsx,ts,js,mjs,cjs}'` | Files the plugin skips.                                                                                                                      |

```js
solidStyled.vite({
  verbose: true,
  prefix: 'my-app',
  browserslist: 'last 2 versions',
  filter: {
    include: 'src/**/*.tsx',
    exclude: 'node_modules/**/*',
  },
});
```

## TypeScript

Add the package types so `<style jsx>` and `use:solid-styled` type check.

```ts
/// <reference types="solid-styled" />
```

You can also add `solid-styled` to `compilerOptions.types` in your `tsconfig.json`.

## Filters

- `filter.include` and `filter.exclude` are glob patterns, or arrays of them, matched against the absolute file path.
- A pattern that does not start with `**` and is not absolute is resolved against the current working directory.
- `exclude` is checked first. A file that matches `exclude` is skipped, even when it also matches `include`.
- Each option replaces its default. Setting only `include` keeps the default `exclude`, which skips everything in `node_modules`.

## Component libraries

The `css` tag throws ``Unexpected use of `css`. Make sure that solid-styled's plugin is setup correctly.`` if a module reaches the runtime without passing through the compiler. A library that uses solid-styled has two options.

### Option 1: the app compiles the library

- Publish the library sources, with `css` calls left in place.
- Add the library to the app's `filter.include`.
- Replace the default `filter.exclude`, because the default skips all of `node_modules`.

```js
// vite.config.js
import solid from '@solidjs/vite-plugin';
import solidStyled from 'unplugin-solid-styled';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    solid(),
    solidStyled.vite({
      filter: {
        include: ['src/**/*.{jsx,tsx}', '**/node_modules/my-lib/**/*.{js,jsx,ts,tsx}'],
        exclude: [],
      },
    }),
  ],
  optimizeDeps: {
    exclude: ['my-lib'],
  },
  ssr: {
    noExternal: ['my-lib'],
  },
});
```

- The `**/node_modules/my-lib/**` pattern also matches pnpm paths such as `node_modules/.pnpm/my-lib@1.0.0/node_modules/my-lib/`.
- Vite resolves workspace packages to their real path. For a workspace package, include that path instead, such as `../my-lib/src/**/*.tsx`.
- `optimizeDeps.exclude` stops Vite from pre-bundling the library in dev. Pre-bundled code does not go through Vite plugins.
- `ssr.noExternal` stops Vite from leaving the library to Node during SSR. External code does not go through Vite plugins either.

### Option 2: the library ships compiled output

- Compile the library with `unplugin-solid-styled` before publishing. The output calls the `solid-styled` runtime, such as `useSolidStyled`, instead of `css`.
- Use a `prefix` unique to the library, so its scope ids never collide with the app's.
- Keep `solid-styled` as a peer dependency, so the app and the library share one runtime. With two copies, the app's `<StyleRegistry>` does not collect the library's sheets.
- Run the plugin on every output the package exports. A JSX output for the `solid` export condition needs it too.

```js
// rollup.config.js
import solidStyled from 'unplugin-solid-styled';

export default {
  input: 'src/index.tsx',
  external: ['solid-js', '@solidjs/web', 'solid-styled'],
  output: { dir: 'dist', format: 'es' },
  plugins: [
    // Must run before the plugin that compiles JSX.
    solidStyled.rollup({
      prefix: 'my-lib',
      filter: {
        include: 'src/**/*.{jsx,tsx}',
      },
    }),
    // ...then your TypeScript and Solid JSX plugins.
  ],
};
```

- `solidStyled` is not a Rollup plugin by itself. Call `solidStyled.rollup(options)`.
- To check a build, search the output for `` css` ``. Any match is a module the plugin did not compile.

## Known limits

- **Astro.** solid-styled 1.0 needs Solid 2.0, and `@astrojs/solid-js` 7.1.2 still needs `solid-js@^1.9`, so 1.0 does not run in Astro yet.
- **StackBlitz.** The compiler uses [LightningCSS](https://lightningcss.dev/), which loads a native binary for the current platform. WebContainers cannot load native binaries, so the plugin fails on StackBlitz with errors such as `wasm is undefined`. Use a local setup, or a Linux container such as GitHub Codespaces.

## Editor support

See [Editor](./editor.md) for syntax highlighting and comment shortcuts.
