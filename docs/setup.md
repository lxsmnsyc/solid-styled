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

## Editor support

- The `css` template is plain CSS, so any editor plugin that highlights `css` tagged templates works.
- Scope markers such as `s:c-1a2b3c-0` only exist in the compiled output, so you never write them by hand.
