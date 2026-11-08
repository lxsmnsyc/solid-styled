# Outcome: pbt-css-scoping

## Built

`packages/solid-styled/test/properties.test.ts`, 9 tests (one is the `:not(...)` example) over `processScopedSheet`, `processCSSTemplate` and `xxHash32`. It uses `cssTemplate` from `arbitraries.ts`. Seed 20261108, `FC_RUNS` and `FC_SEED` widen the search, timeout is `max(5 s, FC_RUNS * 40 ms)`.

- Scoping: each compound selector outside `:global(...)` and `@global` carries the scope attribute exactly once, global ones carry none, and selectors keep their text apart from the attribute and the `:global` wrapper. Checked on the css-tree AST of the output, per compound, against the same count computed from the input.
- Output parses with LightningCSS and css-tree, and processing is deterministic (scoped and unscoped).
- Interpolation: `variables` has one entry per `${}` in order with ids `--s-v-<ns>-<n>`, every `--s-v-*` name in the sheet is one of those ids, a declaration holding variable N has the property the N-th `${}` was written in, and a unit after an interpolation becomes `calc(var(--x) * 1<unit>)`.
- Keyframes: every `@keyframes` name is `<sheet>-<name>` and every `animation` / `animation-name` identifier is renamed alike. Run with `global: false, media: false`.
- `xxHash32` equals `js-xxhash` for well-formed strings (grapheme and binary units, empty) and for bytes with any 32-bit seed. The compiler uses seed 0 and `.toString(16)`; the test checks the hex string too.

## Deviations

- The brief says every `${}` maps to exactly one `var(--...)` in the sheet. That does not hold after LightningCSS: it drops a declaration that a later one overrides, copies a declaration into two rules when it splits a selector list, and merges or reorders equal rules. The property checks the `variables` list (count, order, ids, expressions) and, for each variable that is in the sheet, its unit form. It does not check the position in the sheet.
- The scoping property skips (`fc.pre`) only inputs where an `:is(...)` holds `:global`, or an `@global` block holds `&`, because of the two bugs below. Each has an `it.fails`. About 723 of 5000 inputs are skipped.

## Compiler bugs found

Kept as `it.fails` in `properties.test.ts`. The compiler is not changed.

- `.a, :global(.b) { color: red; }`: LightningCSS rewrites the list as `:is(.a, :global(.b))`. The compiler emits `[s\:c]:is(.a[s\:c],.b){color:red}`. The outer attribute makes the global `.b` match only an element that also carries the scope attribute. Any selector list with `:global(...)` triggers it.
- `@global { .a { &.on { color: blue; } } }`: LightningCSS leaves nesting inside the unknown `@global` at-rule, and `rewriteSelector` drops the `NestingSelector`. Output is `.a{.on{color:blue}}`, so `.on` now matches a descendant. `& > .b` becomes `> .b`. Some outputs do not parse in css-tree (`:global(.a) { & :global(.a) {} }` inside `@global`).

## Gotchas

- `xxHash32` differs from `js-xxhash` for lone surrogates. This is intended. The compiler hashes only `id.split('?')[0]`, a bundler path that is well-formed in practice, and the hash only has to be deterministic. `toUtf8` treats any surrogate as the start of a pair and swallows the next code unit: `'\ud800'`, `'\udc00'` and `'\udc00\udc00'` all hash like U+10000, and `'\ud800a'` like U+10061. The test covers well-formed strings only.
- The keyframes property runs with `global: false, media: false`. `@keyframes` inside `@global` or `@media` is covered only by `keyframes.test.ts`. It also appends a fixed rule that uses an undeclared name (`animation: other 1s ease-in infinite`) and asserts `other` is not renamed.
- LightningCSS turns `::before` and `::after` into `:before` and `:after`, so the pseudo-element branch of the scoping code is not exercised. Follow-up for the generator.
- Selectors inside `:not(...)` and `:is(...)` are scoped too, so `a:not(.off)` becomes `a[s]:not(.off[s])`. The property reads only top-level selectors and strips the attribute everywhere before comparing text.
- `processCSSTemplate` needs a `Ctx`. The test builds one with an empty `names` set and namespace `ns`, so variable ids are `--s-v-ns-<n>`.

## Proposed learnings

- A property over output that passes through LightningCSS must not assume the output keeps the input's rule order or count | LightningCSS merges, reorders, copies and drops rules | packages/solid-styled/test | no

## Verification

- `pnpm format && pnpm build && pnpm test && pnpm lint && pnpm typecheck && pnpm format:check`: all pass (306 passed, 3 expected fail).
- `FC_RUNS=3000` on seeds 7 and 99: no failure, about 3 s each.

## Run time

- `properties.test.ts` with defaults: about 0.8 s.

## Size

- Estimated M, actual M.
