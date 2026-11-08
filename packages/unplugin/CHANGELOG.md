# unplugin-solid-styled

## 1.0.0-next.1

### Major Changes

- 5f3e8c4: Remove the `env` compiler option. The 1.0 compiler never read it, so passing it had no effect. The Vite entry of `unplugin-solid-styled` no longer sets it.

### Patch Changes

- e616c0e: Update dependencies: `oxc-parser` 0.157, `magic-string` 1.4, `browserslist` 4.29 and `unplugin` 3.7. Tests now run against `solid-js` and `@solidjs/web` 2.0.0-rc.21. The `engines` field now says `^20.19.0 || >=22.12.0`, the Node range that `oxc-parser` and `unplugin` already required.
- 26cc612: An invalid `browserslist` option now throws its own error instead of a `CompileError` that points at a template. `solidStyled.vite()` and the other bundler entries no longer throw when called without options.
- Updated dependencies [e616c0e]
- Updated dependencies [5485f5c]
- Updated dependencies [d26a98c]
- Updated dependencies [31d1b34]
- Updated dependencies [d79a8b7]
- Updated dependencies [6a41309]
- Updated dependencies [26cc612]
- Updated dependencies [6e189a2]
- Updated dependencies [193df8c]
- Updated dependencies [55e4e04]
- Updated dependencies [8d31c76]
- Updated dependencies [5f3e8c4]
  - solid-styled@1.0.0-next.2

## 1.0.0-next.0

### Major Changes

- cf6a2f4: Rewrite the compiler on Oxc and retarget the runtime at Solid 2.0.

  The Babel-based plugin is replaced by `oxc-parser` for parsing and
  `magic-string` for output. Only the spans the compiler actually rewrites are
  touched, so untouched code keeps its formatting and comments, and the source
  map is high resolution. The generated stylesheets, scope ids and runtime calls
  are byte for byte identical to the previous compiler.

  Breaking changes:

  - `vite-plugin-solid-styled` and `rollup-plugin-solid-styled` are discontinued.
    Use `unplugin-solid-styled` instead. It provides the same options, and
    `solidStyled.vite(options)` or `solidStyled.rollup(options)` replaces the
    default export of the old packages.
  - `compile(id, code, options)` from `solid-styled/compiler` is now synchronous
    and returns `{ code, map }`. It throws a `CompileError` carrying the line and
    column instead of a Babel error.
  - The peer range is now `solid-js@^2.0.0-rc.5` and `@solidjs/web@^2.0.0-rc.5`.
    The JSX type augmentation moved from `solid-js` to `@solidjs/web`, which is
    where Solid 2.0 exposes the `JSX` namespace.
  - `StyleRegistry` now provides a default context value. Solid 2.0 throws when a
    default-less context is read without a provider, so `useSolidStyled` needs one
    to keep working outside a registry.
  - `<StyleRegistry auto>` uses Solid 2.0's `useHead` instead of the removed
    `useAssets`.
  - The scope hash is derived from the file path without its query string, so the
    same module compiled with and without a query suffix now shares one scope.
  - Generated runtime helpers are imported through a single import statement with
    `_name` locals, instead of one import per helper.
  - The plugin now requires `vite@>=8`.
  - `@babel/core`, `@babel/traverse` and `@babel/types` are no longer
    dependencies.

### Patch Changes

- Updated dependencies [cf6a2f4]
  - solid-styled@1.0.0-next.0
