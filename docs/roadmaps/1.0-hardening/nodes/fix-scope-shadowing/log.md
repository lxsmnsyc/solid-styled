# Log: fix-scope-shadowing

## Failing tests on 1.0

- Commit: `origin/1.0` at `d791fb8`, with only `packages/solid-styled/test/scoping.test.ts` changed.
- Command: `cd packages/solid-styled && npx vitest run test/scoping.test.ts`
- Result: 10 failed, 19 passed (29).
- Failed tests, each with `AssertionError: css template should be left as is: expected 'import { useSolidStyled as _useSolidS…' to contain 'css`a{color:red}`'`:
  - leaves css alone after a var css in a nested block (#50 row 1)
  - leaves css alone inside a switch case that declares let css (#50 row 2)
  - leaves css alone in another case of the same switch
  - leaves css alone inside a class expression named css (#50 row 3)
  - leaves css alone after for (var css ...)
  - leaves css alone after for (var css of ...)
  - leaves css alone after a destructured var { css } in a nested block
  - leaves css alone after a var css in a labeled block
  - leaves css alone before a var css declared later in a nested block
  - leaves css alone after a module-level var css in a nested block
- Already passing on 1.0: `for (let css of ...)`, `catch (css)`, function expression named `css`, `var css` after its use in the same function body, and all the "compiles css" controls.

## Fix

- `hoistVars` in `analyze.ts` walks statements (not expressions) and collects every `var`. It stops at functions and class bodies.
- Function scopes, static blocks and the module now collect nested `var`s.
- `enterScope` has new cases for `SwitchStatement` (declarations from all cases) and `ClassExpression` (its name).
- Same command on the branch: 29 passed.
