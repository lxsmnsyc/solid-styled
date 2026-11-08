# Outcome: oracle-legacy-compiler

## Built

`packages/solid-styled/test/oracle.test.ts`, in `pnpm test`.

- A fast-check property over `component({ modulePoison: false })`. Each module is compiled by `compile` from `../compiler` and by `compile` from `solid-styled-legacy/compiler` (0.12.1, async), with the same options. Options drawn per run: `verbose` (always set), `prefix` (`a`, `my-app`, `x1` or unset), `browserslist` (`chrome 60`, `safari 10`, `firefox 100`, `defaults` or unset). File ids: `src/index.tsx`, `src/components/Button.tsx`, `src/index.tsx?v=1`, `/abs/path/App.tsx?macro=true&lang.tsx`.
- Five fixed cases for an existing `style` attribute (string, object, expression, no value, empty expression). The generators only emit `class="root"`. All five agree with 0.12.1.
- One fixed case for an element in a nested function, where the outer and the inner function both call `css` with interpolations. The element gets two `s:` scopes and nested `mergeStyles` calls. The generators only put elements in the component body.
- The spread bug below was fixed in #71 by merging styles. 1.0 now differs from 0.12.1 there on purpose, so that case is a plain test of the 1.0 output.
- Nothing is exported. Importing a `.test.ts` file runs its tests in the importer, so the helpers stay private.

### Normalization

Both outputs are parsed with oxc-parser (`tsx`, `preserveParens: false`). The test walks the tree and builds one record per output. It never matches the JS code with a regex.

- `compiled`: per template marker, `true` unless a template literal still starts with that marker.
- `sheets`: every `css_N = "<string>"` declarator, in order, name and value.
- `scopes`: every `sheet_N = "<string>"` declarator, in order, name and value.
- `calls`: every call to `vars_N` or to a runtime helper (`useSolidStyled`, `useSolidStyledGlobal`, `createCSSVars`, `mergeStyles`), printed in one fixed format. This holds the sheet ref, index, css ref, and the vars function with its keys and values, for both `useSolidStyled(...), vars_N(() => ({...}))` and `useSolidStyledGlobal(sheet, i, css, () => ({...}))`. Each call carries the path of its enclosing functions (`C > Inner`, or `<module>` at the top level). A function takes its own name, else the name of the declarator it initializes, else `<anonymous>`. So a setup call moved to another function or to the module fails directly, not only through call order. Calls inside a JSX attribute value are skipped, since `elements` prints them. Calls in JSX children are recorded.
- `elements`: per JSX opening element, its name, its own attributes in order, then the `s:*` and `style` attributes (the user's `style` included), each prefixed with the number of spread attributes before it, and sorted. The sort only reorders attributes between the same spreads: `<a s:x style={v} {...p}>` records `0:s:x 0:style={v}`, `<a {...p} s:x style={v}>` records `1:s:x 1:style={v}`.
- Identifiers that are local names of a `solid-styled` import print as the imported name.
- The printer throws on a node type it does not know, so a new output shape fails the test instead of being skipped.

## Intended differences (each filtered with a comment in the test)

1. Query string in the scope hash. 1.0 hashes the path without `?query`, 0.12.1 hashes the whole id. The test gives 0.12.1 the id without the query; 1.0 gets the full id.
2. Units after an interpolation. 1.0 writes `calc(var(--id) * 1px)`, a valid value that lightningcss parses and minifies (`calc(var(--id)*1px)`, and it may drop the space before the next value: `calc(...)50%0`). 0.12.1 writes `var(--id) px` or, inside a shorthand, `var(--id)px`; browsers drop both. In the sheet strings only, both forms become `<unit --id px>`. 1.0 minifies a declaration that holds one as a token list, so it drops each space that ends no token. In such a declaration the filter drops a space only after `%`, `)` or a `<unit ...>` token. A space after a number or a word stays, since dropping it would join two tokens (`0 calc(` and `0calc(` differ). Units are taken from `UNITS` in `arbitraries.ts`.
3. Import alias names. 1.0 uses `_useSolidStyled` in one import statement, 0.12.1 uses `useSolidStyled_1` in one import per helper. Handled by mapping each local to its imported name. The import statements themselves are not compared: 1.0 also imports `mergeStyles` when it does not use it.
4. Errors. 1.0 throws `CompileError`, 0.12.1 throws Babel or lightningcss errors. The test only checks that both throw or both succeed. A throw from one compiler alone fails the test.
5. Position of the added attributes. 1.0 inserts `s:<scope>` and `style` right after the element name. 0.12.1 appends them after the other attributes, and an existing `style` keeps its place. Not listed in the changesets. Between attributes with different names the order has no runtime effect, so the record sorts the added attributes and keeps them apart from the element's own. Order relative to a spread matters, so the sort stays within the attributes between two spreads. That grouping flags the bug below.
6. Formatting and whitespace of the JS code (Babel reprints, 1.0 edits spans). Not compared; the AST record removes it.

## Bugs found

- Spread attribute order. Minimal case:

  ```tsx
  import { css } from 'solid-styled';
  export function C(props: any) {
    css`
      a {
        color: ${props.c};
      }
    `;
    return <a {...props} />;
  }
  ```

  0.12.1: `<a {...props} s:c-186be8d0-0 style={vars_1()} />`. 1.0: `<a s:c-186be8d0-0 style={vars_1()} {...props} />`. In 1.0 a `style` in `props` replaces the CSS variables, so the interpolated values are lost. In 0.12.1 the variables replace `props.style`. Neither merges them. Fixed in #71: the maintainer chose merging, so 1.0 emits `<a {...props} s:… style={_mergeStyles(props?.style, vars_1())} />`. This is now an intended difference, checked by `it('merges a spread style with the CSS variables')`. The generators never emit spreads, so the property does not reach this case; a `spread` option in `component()` would.

- No mismatch inside the generated input space. 5000 runs on seed 424242 and 3000 runs on seeds 1, 7 and 99 all agree after the filters above.

Seen while building, not a mismatch: both compilers keep `:global(.a)` as written in a `<style jsx global>` sheet (`:global(.a){...}`), which browsers drop. Same output in both, so the oracle does not flag it. It may be worth an issue.

## Not compared

- The order of an added attribute relative to the element's own non-spread attributes (intended difference 5).
- The import statements (intended difference 3).
- Spaces after `%`, `)` and a unit token inside a declaration that holds a unit interpolation (intended difference 2).
- The JS code outside the records: statements that are not `sheet_N` or `css_N` declarators or runtime calls.
- The text of compile errors.

## Mutation check

A reviewer applied 24 mutations to `compiler/core`. The first version missed 3: the element `s:` taking the innermost function's scope, the per-element function order reversed, and a dropped space before a unit interpolation (`margin:0calc(...)`). All 3 are now caught: the first 2 by the nested function case, the third by the property and the nested case. The intended difference "`s:` moved to the end of the element" (no spread) still passes. All 23 non-intended mutations fail at least one test.

## Run time

- Default (300 runs, seed 20261108): about 0.9 s for the property, 1.3 s for the file.
- About 2 ms per run. `FC_RUNS=3000`: about 6 to 7 s. `FC_RUNS=5000`: about 11 s.
- Timeout: `max(10 s, FC_RUNS * 50 ms)`.

## For spike-css-pipeline

To compare sheet bytes of a candidate pipeline with 0.12.1, copy the pattern instead of importing the test file:

- Generate modules with `component({ modulePoison: false })` (or `cssTemplate()` wrapped in a `css` call).
- Compile with `compileLegacy(id, code, opts)` and with the candidate.
- Parse both outputs with oxc-parser and collect the `css_N` and `sheet_N` string declarators (`recordDeclarator` in `oracle.test.ts`, about 10 lines).
- Apply the unit filter (`UNIT_CALC`, `UNIT_SPACED`, `UNIT_DECLARATION`, `TOKEN_END_SPACE` and `normalizeUnits`) unless the candidate is compared to 1.0 output, where no filter is needed.
- Compare the strings in order. Today's pipeline passes this byte for byte (minus the unit filter), so any change in a candidate's sheet strings is a real difference.

If the spike wants shared code, the clean move is a `test/oracle-helpers.ts` module that both files import. This node did not create it because it owns only `oracle.test.ts`.

## Deviations

- The brief allows comparing formatted code or extracted artifacts. Extracted artifacts were chosen, as the task asked.
- Default runs: 300 (the brief asks for at least 200).
- The review asked to drop only the space right after a unit token. That fails on seed 20261108: 1.0 also turns `50% 0` into `50%0` in such a declaration. The filter drops a space after `%` and `)` too, and still catches `0 calc(` becoming `0calc(`.

## Stubs left

- None.

## Gotchas

- Pass `modulePoison: false`. Babel rejects the module-level `var` that redeclares the import.
- Do not import a `.test.ts` file from another test file: its `describe` blocks run again in the importer.
- In global sheets lightningcss does not minify, so `calc(var(--id) * 1px)` keeps its spaces. The unit filter allows both.
- `pnpm lint` through the `rtk` proxy prints a JSON parse error and exit 1 even when oxlint passes. Use `rtk proxy pnpm lint` to see the real result.

## Proposed learnings

- Compare compiler outputs through a parsed record, not regexes on code | Babel reprints, so text comparisons break on formatting | packages/solid-styled/test | yes
- A filter for an intended difference must cover every form the old output takes (`var(--x) px` and `var(--x)px`) | the first filter missed the shorthand form | packages/solid-styled/test | yes

## Verification

- `pnpm format && pnpm build && pnpm test && pnpm lint && pnpm typecheck && pnpm format:check`: all pass. 18 files, 306 passed, 2 expected fail (the `@media` case in `arbitraries.test.ts` and the spread case here).
- `FC_RUNS=3000` with `FC_SEED` 1, 7, 99, and `FC_RUNS=5000` with `FC_SEED=424242`: no counterexample.

## Size

- Estimated M, actual M.
