# Outcome: fix-enum-shadowing

## Built

- `packages/solid-styled/compiler/core/analyze.ts`: `hoistStatements` declares the name of a `TSEnumDeclaration` (`enum` and `const enum`) in its block scope.
- 8 tests in `packages/solid-styled/test/scoping.test.ts` (`css shadowed by a local TypeScript declaration`).
- Changeset: `.changeset/fix-enum-shadowing.md` (patch).

## Proof

- base: 722da29 (`origin/1.0`) with only the tests added, `pnpm --filter solid-styled exec vitest run test/scoping.test.ts`: 4 failed, 33 passed. Each failure is `css template should be left as is`. Cases: `enum css`, `enum css` declared after use, `const enum css`, `enum css` in a nested block.
- branch: same command, 37 passed.

## Deviations

- None.

## Stubs left

- None.

## Gotchas

- `type css` and `interface css` create no value, so they do not shadow. Tests cover both.
- Other TypeScript value bindings: `namespace` and `import x = ...` are only valid at the top level or inside a namespace, where they clash with the import. A function body cannot hold them, so nothing else was missed there. The module scope still ignores them, as before.
- `declare enum css` is treated like `declare const css`: it shadows.

## Proposed learnings

- None.

## Verification

- `pnpm build && pnpm test && pnpm lint && pnpm typecheck && pnpm format:check`: pass, 243 unit tests.

## Size

- Estimated S, actual S.
