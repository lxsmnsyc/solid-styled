---
'solid-styled': major
'unplugin-solid-styled': major
---

Rewrite the compiler on Oxc and retarget the runtime at Solid 2.0.

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
