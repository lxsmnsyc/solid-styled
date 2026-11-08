# Outcome: fix-scope-shadowing

## Built

- `packages/solid-styled/compiler/core/analyze.ts`: new `hoistVars` collects every `var` in a statement list, nested blocks included. It walks statements only and stops at functions and classes.
- Function scopes, class static blocks and the module now declare nested `var`s.
- `enterScope` declares the names from all `case` clauses of a `SwitchStatement`, and the name of a `ClassExpression`.
- 23 new tests in `packages/solid-styled/test/scoping.test.ts` (`css shadowed by a local binding (#50)`). No snapshot changed.
- Changeset: `.changeset/fix-scope-shadowing.md` (patch).

## Proof

- base: `d791fb8` (`origin/1.0`) with only the tests added, `cd packages/solid-styled && npx vitest run test/scoping.test.ts`: 10 failed, 19 passed. Each failure is `css template should be left as is: expected 'import { useSolidStyled as _useSolidS…' to contain 'css`a{color:red}`'`. It covers the three rows of #50, `for (var css ...)`, `for (var css of ...)`, destructured `var { css }` in a block, `var` in a labeled block, a nested `var` declared after use, and a module-level nested `var`.
- branch: same command, 29 passed.

## Deviations

- Added a module-level case (`if (a) { var css }` at the top of the file). It had the same cause.

## Stubs left

- None.

## Gotchas

- `for (let css of ...)`, `catch (css)`, a function expression named `css` and `var css` after use in the same function body already worked on `1.0`. They are covered by tests now.
- Not fixed: TypeScript value declarations such as `enum css {}` or `namespace css {}` inside a function are not treated as bindings. `hoistStatements` ignores `TSEnumDeclaration` and `TSModuleDeclaration`.

## Proposed learnings

- Scope rules in `analyze.ts` need a test with a positive control (unshadowed `css` still compiles) next to each shadowing case | a too-broad scope hides the import silently | packages/solid-styled/compiler/core | yes

## Verification

- `pnpm build && pnpm test && pnpm lint && pnpm typecheck && pnpm format:check`: pass, 235 unit tests.
- `pnpm test:e2e`: 9 passed.

## Size

- Estimated M, actual S. The fix is one helper and three `enterScope` cases.
