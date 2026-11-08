# Migrating from 0.x

This page lists every breaking change from 0.12.x to 1.0. Work through it top to bottom.

## Requirements

- [ ] **Solid 2.0.** The peer range is now `solid-js@^2.0.0-rc.5` and `@solidjs/web@^2.0.0-rc.5`. Upgrade Solid first, then install `solid-styled@next` and `unplugin-solid-styled@next`.
- [ ] **Node.** Both packages now require Node `^20.19.0 || >=22.12.0`, the range `oxc-parser` and `unplugin` need. Upgrade Node if you are on an older release.
- [ ] **Vite 8.** `unplugin-solid-styled` now requires `vite@>=8` when you use Vite. Upgrade Vite.
- [ ] **ESM only.** Both packages ship ES modules only. The CommonJS builds and the `development` export condition are gone. Node `^20.19.0 || >=22.12.0` can `require()` them, so most setups need no change. In a CommonJS config, the plugin is on `default`: `require('unplugin-solid-styled').default.vite()`.

## Plugins

- [ ] **`vite-plugin-solid-styled` and `rollup-plugin-solid-styled` are removed.** Uninstall them and install `unplugin-solid-styled`. Replace the default export call with the matching entry. The options are the same.

  ```js
  // Before
  import solidStyled from 'vite-plugin-solid-styled';
  solidStyled({ prefix: 'my-app' });

  // After
  import solidStyled from 'unplugin-solid-styled';
  solidStyled.vite({ prefix: 'my-app' });
  ```

  For Rollup, use `solidStyled.rollup(options)`. See [Getting started](./getting-started.md#vite-setup).

- [ ] **The `env` option is removed.** The 1.0 compiler never read it. Delete `env` from your plugin options and `compile()` calls. TypeScript reports it as an unknown property.

## Compiler API

Skip this section if you only use the bundler plugin.

- [ ] **`compile()` is synchronous.** `compile(id, code, options)` from `solid-styled/compiler` now returns `{ code, map }` directly instead of a promise. Remove the `await`.
- [ ] **The source map comes from magic-string.** `map` is a magic-string source map with `hires: true`, not a Babel map. It has the standard `version`, `sources`, `names` and `mappings` fields.
- [ ] **Errors are `CompileError`.** A parse error, a CSS error in a template or an invalid `style` value throws a `CompileError`. 0.x threw a Babel error. It has 1-based `line` and `column` fields, and the message ends with `(line:column)`. Update any code that reads Babel error fields such as `loc`.
- [ ] **Babel is gone.** `@babel/core`, `@babel/traverse` and `@babel/types` are no longer dependencies. Add them to your own `package.json` if your code imported them through solid-styled.

See [`solid-styled/compiler`](./api.md#solid-styledcompiler).

## Runtime

- [ ] **`StyleRegistry` has a default context.** Solid 2.0 throws when a context without a default is read without a provider. `useSolidStyled` keeps working outside a registry. No action needed.
- [ ] **`<StyleRegistry auto>` uses `useHead`.** Solid 2.0 removed `useAssets`, so the sheets are now added as head tags through `useHead`. No action needed, unless your server template placed the `useAssets` output itself. Then render the head tags that Solid 2.0 collects.
- [ ] **JSX types moved to `@solidjs/web`.** The `jsx`, `global` and `use:solid-styled` attribute types now augment the `JSX` namespace of `@solidjs/web`. That is where Solid 2.0 exposes it. Keep `/// <reference types="solid-styled" />` or `compilerOptions.types`. See [TypeScript](./getting-started.md#typescript).

## Output

- [ ] **The scope hash ignores query strings.** The hash comes from the file path without its query. A module compiled with and without a query suffix shares one scope. Some scope ids differ from 0.x. Rebuild the server and client together, and do not hard-code scope ids in tests or selectors.
- [ ] **One import for runtime helpers.** The compiled code imports every helper in one statement, with `_name` locals such as `_useSolidStyled`. Update any tooling or snapshot test that matches the old output.
- [ ] **Units after an interpolation use `calc()`.** `width: ${size()}px` now compiles to `width: calc(var(--s-v-...) * 1px)`. 0.x compiled it to `var(--s-v-...) px`, which browsers drop. Pass a bare number when a unit follows the interpolation. If you added the unit inside the value, such as `${size() + 'px'}`, that still works.
- [ ] **Spread attributes merge styles.** With 0.12.1 the CSS variables replaced the `style` from a spread such as `{...props}`. Now the CSS variables merge into whichever `style` Solid resolves. Remove any workaround that merged `props.style` by hand. See [Spread attributes](./how-it-works.md#spread-attributes).
- [ ] **Constructor parameter properties shadow `css`.** A parameter property such as `constructor(private css: any)` now shadows the `css` import, like any other local binding. 0.12.1 compiled `css` templates in that constructor anyway. Rename the parameter if a template there should compile.
