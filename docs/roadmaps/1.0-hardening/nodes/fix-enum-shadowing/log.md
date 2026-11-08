# Log: fix-enum-shadowing

## Proof on base

- base commit: 722da29 (origin/1.0), tests added to test/scoping.test.ts, no fix.
- command: `pnpm --filter solid-styled exec vitest run test/scoping.test.ts`
- result: 4 failed, 33 passed. Each failure: `css template should be left as is: expected 'import { useSolidStyled as _useSolidS…' to contain 'css`a{color:red}`'`. Failing cases: `enum css`, `enum css` declared after use, `const enum css`, `enum css` in a nested block.
- passing on base: sibling function compiles, `type css` and `interface css` do not shadow.

## Fix

- Added `TSEnumDeclaration` to `hoistStatements` in analyze.ts.
- Same command on the branch: 37 passed.
