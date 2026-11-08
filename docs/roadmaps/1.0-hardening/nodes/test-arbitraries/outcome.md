# Outcome: test-arbitraries

## Built

Generators in `packages/solid-styled/test/arbitraries.ts`, checks in `packages/solid-styled/test/arbitraries.test.ts`. The contract shape changed; see `contracts/test-arbitraries.change-request.md`.

Exports (all use `import fc from 'fast-check'`):

- `cssTemplate(opts?: CssTemplateOptions): fc.Arbitrary<GeneratedCss>`.
  - `CssTemplateOptions`: `global?`, `keyframes?`, `media?`, all default `true`. `global: false` drops `@global { }` and `:global(...)`.
  - `GeneratedCss`: `source` (template body), `vars` (the `${...}` expressions in source order, recorded while building), `sample` (`source` with each interpolation and its unit replaced by a valid value of its kind).
  - Content: type, class, id, attribute and universal selectors, pseudo classes and elements, combinators, selector lists, `:global(.x)`, one level of `&` nesting, `@media`, `@keyframes` with a rule using it, `@global { }`. At most 3 top-level items.
  - Values: each property has a kind (color, length, number, time). Only `margin` and `padding` take several parts (up to 4). `auto` only where valid. Units after `${x}` follow the kind: length units for lengths, `ms`/`s` for time, none for number and color. A test checks every declaration of `sample` with the css-tree lexer.
- `component(opts?: ComponentOptions): fc.Arbitrary<GeneratedModule>`.
  - `ComponentOptions`: `imports?`, `shadows?`, `controls?`, `styleJsx?`, `useAttribute?`, `modulePoison?`, `maxComponents?` (default 2), `css?` (passed to `cssTemplate`).
  - `GeneratedModule`: `code`, `importForm`, `templates`.
  - `GeneratedTemplate`: `marker` (`/*t<N>*/`, unique in the module), `kind` (`css`, `style` or `global`), `compiled`, `vars`.
- `countCompiled(code): number`: parses the output with oxc-parser and counts calls to `^_?useSolidStyled(Global)?(_\d+)?$`. Works on new and 0.12.1 output. Throws when the output does not parse.
- `invalidComponent(): fc.Arbitrary<InvalidModule>`: `{ code, reason }` with `reason` one of `expression-body`, `style-value`, `syntax`. Each must throw `CompileError`.
- Building blocks: `UNITS` (per value kind), `IMPORT_FORMS`, `DEFAULT_IMPORT_FORMS`, `SHADOW_KINDS`, `CONTROL_KINDS`, `FUNCTION_SCOPED_SHADOWS`, types `ImportForm`, `ShadowKind`, `ControlKind`, `TemplateKind`, `GeneratedTemplate`, `GeneratedCss`, `CssTemplateOptions`, `InvalidReason`, `InvalidModule`.

## How expectations work

- A template has `compiled: true` when it must become a `useSolidStyled` or `useSolidStyledGlobal` call: every `<style jsx>` template (global or not), and every `css` template whose tag still resolves to the `solid-styled` import.
- Check a compile with `countCompiled(output) === templates.filter(compiled).length`, and for each template: `output.includes('`' + marker) === !compiled`. Compiling minifies the marker comment away.
- Import forms: `named`, `aliased` (`css as c`), `namespace` (`s.css`), `with-type` (`{ css, type CSSProperties }`), `default-and-named`, `two-aliases` (`{ css, css as c }`, both used), `type-only`, `type-specifier`, `foreign`, `none`. Type imports must not compile. They are left out of `DEFAULT_IMPORT_FORMS` because of a compiler bug (below). With `none`, only `<style jsx>` is generated.
- Shadow kinds (each untouched): `let`, `const`, `var-nested`, `var-later`, `var-later-top`, `var-destructured`, `var-labeled`, `parameter`, `parameter-destructured`, `parameter-default`, `class-name`, `class-expression-name`, `switch-case`, `switch-other-case`, `catch-param`, `for-var`, `for-of-var`, `for-let-of`, `function-expression-name`.
- Control kinds (each compiled): `switch-outside`, `class-expression-outside`, `for-let-of-outside`, `catch-outside`, `function-expression-outside`, `var-in-sibling-function`, `var-in-arrow`, `var-in-static-block`, `nested-callback` (a `css` call inside a callback in the component).
- A `FUNCTION_SCOPED_SHADOWS` kind hides its local from every template in its component. With `two-aliases`, it hides only the alias it declares.
- Module poison: about 1 module in 8 gets `if (globalThis.a) { var <local> = ...; }` at the top. It hides the first tag in every component.
- `<style jsx>` elements hold 1 to 3 template children.

## Deviations

- `component` returns an object, not a string (change request written).
- `COMPILED_CALL` is gone; use `countCompiled`.
- Interpolation expressions are always `props.<name>`. The component takes `props: any`.

## Compiler bugs found

Kept as `it.fails` in `arbitraries.test.ts` under "known compiler bugs". Not fixed here.

- `import type { css }` and `import { type css }` still compile. 0.12.1 leaves them alone.
- An exported expression-body arrow with a static `<style jsx>` emits `export _useSolidStyled(sheet_1, 1, css_1);\nconst C = ...`, which does not parse. 0.12.1 emits valid code. Both put the call at module level.
- `${...}` in an `@media` query throws a plain `SyntaxError` from lightningcss, not a `CompileError`.

## Gotchas

- `${...}` inside an `@media` query: 0.12.1 also rejects it ("Invalid media query"). The generators never put one there. The oracle node does not need to model it.
- The module-level poison `var css` redeclares the import. That is an early error in JS. oxc-parser accepts it, Babel (0.12.1) rejects it. Pass `modulePoison: false` when the output goes through 0.12.1.
- Modules are TSX. Compile them with a `.tsx` file id (`src/index.tsx`).
- An expression-body arrow component with a `<style jsx>` that has an interpolation throws `CompileError` (documented: block body needed). `component()` never generates expression bodies.
- Nested rules never follow a pseudo element (lightningcss rejects it).
- Use a fixed `seed` in tests that import these generators so failures reproduce.
- `FC_RUNS` and `FC_SEED` widen the search. Every property scales its runs with `FC_RUNS`, and the per-test timeout is `max(5 s, FC_RUNS * 40 ms)`.

## Run time

- `arbitraries.test.ts` with defaults (seed 20261108): about 0.7 s for 39 tests. The whole package suite runs in about 1 s.
- `FC_RUNS=3000` on seeds 7 and 99: about 8 s each, no failure. `FC_RUNS=1500` on seed 1: 4.4 s, no failure.
- The 0.12.1 differential runs 30 modules by default (400 at `FC_RUNS=3000`). All agree with the expected templates, type imports included.

## Proposed learnings

- Generators that mirror a scope rule must also compute the expected result per template, not only a count | oracle tests need something to assert on | packages/solid-styled/test | yes

## Verification

- `pnpm format && pnpm build && pnpm test && pnpm lint && pnpm typecheck && pnpm format:check`: all pass (15 files, 270 tests, 4 expected fail).
- `pnpm --filter solid-styled test` 3 times, then once after clearing the vite and vitest caches: all pass each time. Six cold runs in parallel (to imitate slow workers) took about 6 s each and all passed. The 5 failures from the reviewer's first cold run did not reproduce.

## Size

- Estimated M, actual M.
