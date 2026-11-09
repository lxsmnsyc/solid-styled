# solid-styled

## 1.0.0-next.2

### Major Changes

- 5f3e8c4: Remove the `env` compiler option. The 1.0 compiler never read it, so passing it had no effect. The Vite entry of `unplugin-solid-styled` no longer sets it.

### Minor Changes

- 193df8c: Fix lost CSS variables on elements that spread props. With 0.12.1 the compiler put its `s:` marker and `style` after the spread, so the CSS variables replaced the `style` from the spread. Now the marker goes after the last spread, and the CSS variables merge into the `style` Solid resolves: the last source with a `style` key, with `null` and `undefined` spreads skipped. An explicit `style` merges the CSS variables in place, and each spread after it is wrapped in place by `spreadStyle`, a new runtime export that only compiled code needs to call. When the spread has a `style` key, `spreadStyle` merges the CSS variables into it through Solid's `merge`, so getters and reactivity survive. The spread is not copied or moved, so a call in it runs as often as with any other reactive attribute on the element, and the element stays in its parent template.

### Patch Changes

- e616c0e: Update dependencies: `oxc-parser` 0.157, `magic-string` 1.4, `browserslist` 4.29 and `unplugin` 3.7. Tests now run against `solid-js` and `@solidjs/web` 2.0.0-rc.21. The `engines` field now says `^20.19.0 || >=22.12.0`, the Node range that `oxc-parser` and `unplugin` already required.
- 5485f5c: A local `enum css` or `const enum css` inside a function now shadows the `css` import. The template in that scope is left as is, like with `let css`. `type css` and `interface css` still do not shadow it.
- d26a98c: `CompileError` now reports a 1-based column, like its line, so `(line:column)` in the message matches the position editors show. Code that reads `error.column` gets a value one higher than before. Fixes #49.
- 31d1b34: Fix invalid output for exported components that use `<style jsx>` in an arrow function with an expression body. The compiler put the setup call between `export` and the declaration. It now goes before the whole `export` statement, as in 0.12.1. The same fix applies to `export class` and `export default class` with arrow class fields.
- d79a8b7: A CSS error in a template, such as `${}` inside an `@media` query, now throws a `CompileError` with the template's line and column. It threw a plain `SyntaxError` before.
- 6a41309: A local `css` binding inside a TypeScript `namespace` now shadows the `css` import. This covers `const`, `let`, `var`, `function`, `class`, `enum` and `import css = M.x`, and a local that shadows `import * as s`. A constructor parameter property such as `constructor(private css: any)` now shadows it too. The template in those scopes is left as is. Code outside the namespace or class still compiles. Namespace shadowing worked in 0.12.1 and was lost in 1.0. Parameter properties were never handled.
- 26cc612: An invalid `browserslist` option now throws its own error instead of a `CompileError` that points at a template. `solidStyled.vite()` and the other bundler entries no longer throw when called without options.
- 6e189a2: A local binding named `css` now stops the compiler from treating `css` templates as `solid-styled` templates in more places. The compiler now sees a `var` declared in a nested block or loop, a `let` or `const` declared in a `switch` case, and the name of a class expression. Before, it compiled these templates anyway. Fixes #50.
- f1f1983: The source map now covers the `${...}` expressions of `css` templates and `<style jsx>` elements. The compiler keeps those expressions in place, or moves them into the hoisted setup call, instead of copying their text, so they map back to where they were written. The map also embeds the source (`sourcesContent`) and names the file without its query string.
- 55e4e04: Fix `<style jsx>` in a component whose `return` is the unbraced body of `if`, `else`, a loop or a label. The setup call became that body and the `return` ran every time. The call now goes before the outermost control statement, as in 0.12.1.
- 8d31c76: Fix type-only imports of `css` being compiled. `import type { css }`, `import { type css }` and `import type * as s` no longer count as the runtime `css` import, so their templates are left as written. This matches 0.12.1.

## 1.0.0-next.1

### Patch Changes

- a473284: Support CSS units written right after an interpolation, as in `width: ${size()}px`. The compiler used to output `var(--id) px`, which browsers drop. It now outputs `calc(var(--id) * 1px)`.

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
