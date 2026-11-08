# Outcome: fix-media-compile-error

## Built

- `preprocessCSS(ctx, content, template)` in `packages/solid-styled/compiler/core/preprocess-css.ts` rethrows any LightningCSS error as a `CompileError` through `ctx.error`, keeping the message text. `process-css-template.ts` passes the template node.
- The `@media` `it.fails` case in `test/arbitraries.test.ts` is now `it`.
- Changeset: `.changeset/fix-media-compile-error.md` (patch).

## Proof

- base: origin/1.0, `pnpm vitest run test/output.test.ts`, the new test fails with a plain `SyntaxError: Invalid media query`.
- branch: same command, all pass. The error has line 3, column 6, the template start.

## Deviations

- None.

## Stubs left

- None.

## Gotchas

- The location is the template start, not the offending character. LightningCSS positions refer to the rewritten sheet (`var(--s-...)` in place of `${}`), so mapping back is unreliable.

## Proposed learnings

- Errors raised from compiler code go through `ctx.error` or `compileError` | so users get a located `CompileError` | packages/solid-styled/compiler/core | no

## Verification

- `pnpm format && pnpm build && pnpm test && pnpm lint && pnpm typecheck && pnpm format:check`: all clean, 301 tests pass.

## Size

- Estimated S, actual S.
