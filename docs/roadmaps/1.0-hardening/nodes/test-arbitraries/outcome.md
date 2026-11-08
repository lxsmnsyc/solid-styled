# Outcome: test-arbitraries

## Built

Generators in `packages/solid-styled/test/arbitraries.ts`, checks in `packages/solid-styled/test/arbitraries.test.ts`. The contract shape changed for `component`; see `contracts/test-arbitraries.change-request.md`.

Exports (all use `import fc from 'fast-check'`):

- `cssTemplate(): fc.Arbitrary<{ source: string; vars: string[] }>`. `source` is a template body. `vars` lists the `${...}` expressions in source order (always `props.<name>`). It has type, class, id, attribute and universal selectors, pseudo classes and elements, combinators, selector lists, `:global(.x)`, one level of `&` nesting, `@media`, `@keyframes` with a rule using it, `@global { }`, and interpolations in property values, with and without a unit (`${props.size}px`). At most 3 top-level items.
- `component(opts?: ComponentOptions): fc.Arbitrary<GeneratedModule>`.
  - `ComponentOptions`: `imports?: ImportForm[]`, `shadows?: ShadowKind[]`, `controls?: ControlKind[]`, `styleJsx?: boolean`, `useAttribute?: boolean`, `maxComponents?: number`. All default to everything on, 2 components.
  - `GeneratedModule`: `code`, `expectedCompiled`, `expectedUntouched`, `expectedCss`, `expectedStyle`, `expectedGlobal`, `importForm`, `local`, `vars`.
- `COMPILED_CALL`: `/useSolidStyled(?:Global)?\(/g`. `output.match(COMPILED_CALL)?.length ?? 0` equals `expectedCompiled`.
- Building blocks: `UNITS`, `SHADOW_KINDS`, `CONTROL_KINDS`, `FUNCTION_SCOPED_SHADOWS`, types `ImportForm`, `ShadowKind`, `ControlKind`, `GeneratedCss`.

## How expected counts work

- `expectedCompiled` = templates that must become a `useSolidStyled` or `useSolidStyledGlobal` call: every `<style jsx>` (global or not) plus every `css` template whose tag still resolves to the `solid-styled` import. It equals `expectedCss + expectedStyle`.
- `expectedUntouched` = `css` templates that must stay as written: the tag is shadowed, or imported from `other-styled` (`foreign`), or never imported.
- Import forms: `named`, `aliased` (`css as c`), `namespace` (`s.css`), `foreign`, `none`. With `none`, only `<style jsx>` is generated.
- Shadow kinds (each expected untouched): `let`, `var-nested`, `var-later`, `parameter`, `class-name`, `class-expression-name`, `switch-case`, `switch-other-case`, `catch-param`, `for-var`, `for-of-var`, `for-let-of`, `function-expression-name`. Control kinds (each expected compiled): `switch-outside`, `class-expression-outside`, `for-let-of-outside`, `catch-outside`, `function-expression-outside`, `var-in-sibling-function`, `var-in-arrow`, `var-in-static-block`.
- A `var` kind (`FUNCTION_SCOPED_SHADOWS`) hides `css` from every template in its component, so the generator marks the other `css` templates of that component untouched. This mirrors analyze.ts hoisting.

## Deviations

- `component` returns an object, not a string (change request written).
- Interpolation expressions are always `props.<name>`. The component takes `props: any`.

## Stubs left

- None.

## Gotchas

- Modules are TSX. Compile them with a `.tsx` file id (`src/index.tsx`).
- Counting `useSolidStyled(` works because the import line has no `(`. Do not count the bare name.
- Nested rules never follow a pseudo element (lightningcss rejects it). Do not add that to the generator.
- Run time: the file runs in about 1.5 s with the defaults (150 runs, seed 20261108). `FC_RUNS` and `FC_SEED` env vars widen the search. 2500 runs on seed 99 took 28 s and found no failure.
- Use a fixed `seed` in tests that import these generators so failures reproduce.

## Proposed learnings

- Generators that mirror a scope rule must also compute the expected result, not only the input | oracle tests need a count to assert on | packages/solid-styled/test | yes

## Verification

- `pnpm build && pnpm test && pnpm lint && pnpm typecheck && pnpm format:check`: all pass (15 files, 242 tests).
- No compiler bug found in 150 default runs, nor in 3000 runs on seed 7 and 2500 runs on seed 99 (the 3000-run seed-7 run hit the 5 s test timeout only).

## Size

- Estimated M, actual M.
