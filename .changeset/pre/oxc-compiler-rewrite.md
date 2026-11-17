---
'solid-styled': major
'unplugin-solid-styled': major
---

Support Solid 2.0 and rewrite the compiler on Oxc.

The peer range is now `solid-js@^2.0.0` and `@solidjs/web@^2.0.0`. Solid 1 users stay on the previous major, `solid-styled@0.x` (the `0.x` branch), which keeps getting fixes.

The Babel-based plugin is replaced by `oxc-parser` for parsing and `magic-string` for output. Only the spans the compiler rewrites are touched, so untouched code keeps its formatting and comments. The source map is high resolution, covers the `${...}` expressions of `css` templates and `<style jsx>` elements, embeds the source (`sourcesContent`) and names the file without its query string. The generated stylesheets, scope ids and runtime calls match the previous compiler.

Breaking changes:

- `solid-js` and `@solidjs/web` `^2.0.0` are required. Solid 1 is not supported. The JSX type augmentation moved from `solid-js` to `@solidjs/web`, where Solid 2.0 exposes the `JSX` namespace.
- `vite-plugin-solid-styled` and `rollup-plugin-solid-styled` are discontinued. Use `unplugin-solid-styled` instead. It provides the same options, and `solidStyled.vite(options)` or `solidStyled.rollup(options)` replaces the default export of the old packages.
- `compile(id, code, options)` from `solid-styled/compiler` is now synchronous and returns `{ code, map }`. It throws a `CompileError` carrying the 1-based line and column instead of a Babel error.
- The `env` compiler option is removed. The compiler never read it in this version, and the Vite entry of `unplugin-solid-styled` no longer sets it.
- `StyleRegistry` now provides a default context value. Solid 2.0 throws when a default-less context is read without a provider, so `useSolidStyled` needs one to keep working outside a registry.
- `<StyleRegistry auto>` uses Solid 2.0's `useHead` instead of the removed `useAssets`.
- The scope hash is derived from the file path without its query string, so the same module compiled with and without a query suffix now shares one scope.
- Generated runtime helpers are imported through a single import statement with `_name` locals, instead of one import per helper.
- The plugin requires `vite@>=8`.
- Node `^20.19.0 || >=22.12.0` is required, the range that `oxc-parser` and `unplugin` need.
- `@babel/core`, `@babel/traverse` and `@babel/types` are no longer dependencies.
