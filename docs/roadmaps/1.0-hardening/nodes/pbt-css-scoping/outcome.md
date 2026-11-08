# Outcome: pbt-css-scoping

## Built

`packages/solid-styled/test/properties.test.ts`, 9 tests over `processScopedSheet`, `processCSSTemplate` and `xxHash32`. It uses `cssTemplate` from `arbitraries.ts`. Seed 20261108, `FC_RUNS` and `FC_SEED` widen the search, timeout is `max(5 s, FC_RUNS * 40 ms)`.

- Scoping: each compound selector outside `:global(...)` and `@global` carries the scope attribute exactly once, global ones carry none, and selectors keep their text apart from the attribute and the `:global` wrapper. Checked on the css-tree AST of the output, per compound, against the same count computed from the input.
- Output parses with LightningCSS and css-tree, and processing is deterministic (scoped and unscoped).
- Interpolation: `variables` has one entry per `${}` in order with ids `--s-v-<ns>-<n>`, and a unit after an interpolation becomes `calc(var(--x) * 1<unit>)`.
- Keyframes: every `@keyframes` name is `<sheet>-<name>` and every `animation` / `animation-name` identifier is renamed alike. Run with `global: false, media: false`.
- `xxHash32` equals `js-xxhash` for well-formed strings (grapheme and binary units, empty) and for bytes with any 32-bit seed. The compiler uses seed 0 and `.toString(16)`; the test checks the hex string too.

## Deviations

- The brief says every `${}` maps to exactly one `var(--...)` in the sheet. That does not hold after LightningCSS: it drops a declaration that a later one overrides, copies a declaration into two rules when it splits a selector list, and merges or reorders equal rules. The property checks the `variables` list (count, order, ids, expressions) and, for each variable that is in the sheet, its unit form. It does not check the position in the sheet.
- The scoping property skips (`fc.pre`) inputs where LightningCSS emits `:is(...)` or the sheet keeps a nested `&`, because of the two bugs below. Each has an `it.fails`.

## Compiler bugs found

Kept as `it.fails` in `properties.test.ts`. The compiler is not changed.

- `.a, :global(.b) { color: red; }`: LightningCSS rewrites the list as `:is(.a, :global(.b))`. The compiler emits `[s\:c]:is(.a[s\:c],.b){color:red}`. The outer attribute makes the global `.b` match only an element that also carries the scope attribute. Any selector list with `:global(...)` triggers it.
- `@global { .a { &.on { color: blue; } } }`: LightningCSS leaves nesting inside the unknown `@global` at-rule, and `rewriteSelector` drops the `NestingSelector`. Output is `.a{.on{color:blue}}`, so `.on` now matches a descendant. `& > .b` becomes `> .b`. Some outputs do not parse in css-tree (`:global(.a) { & :global(.a) {} }` inside `@global`).
- Low impact: `xxHash32('\ud800')` differs from `js-xxhash`. The compiler encodes a lone surrogate as three raw bytes, `TextEncoder` writes U+FFFD. Only odd file ids hit it, and the hash is only a namespace.

## Gotchas

- Selectors inside `:not(...)` and `:is(...)` are scoped too, so `a:not(.off)` becomes `a[s]:not(.off[s])`. The property reads only top-level selectors and strips the attribute everywhere before comparing text.
- `processCSSTemplate` needs a `Ctx`. The test builds one with an empty `names` set and namespace `ns`, so variable ids are `--s-v-ns-<n>`.

## Proposed learnings

- A property over output that passes through LightningCSS must not assume the output keeps the input's rule order or count | LightningCSS merges, reorders, copies and drops rules | packages/solid-styled/test | no

## Verification

- `pnpm format && pnpm build && pnpm test && pnpm lint && pnpm typecheck && pnpm format:check`: all pass (305 passed, 4 expected fail).
- `FC_RUNS=3000` on seeds 7 and 99: no failure, about 3 s each.

## Run time

- `properties.test.ts` with defaults: about 0.8 s.

## Size

- Estimated M, actual M.
