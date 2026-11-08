# Outcome: mbt-style-registry

## Built

- `packages/solid-styled/test/registry.model.test.ts`: a model-based test of the sheet registry in `src/core.ts`, using `fc.commands` with a fixed seed (20260508, 150 runs).
- Client model: `Map<index, count>` plus the sheet stored at the first insert. Commands: mount (plain or global with vars, with or without `<StyleRegistry>`, each in its own `createRoot`), dispose a mounted root, update vars of a mounted global sheet. Invariants after each command: one `<style s:id>` in `document.head` per index with count > 0, none for count 0, content equals the stored sheet (first sheet wins), and each live root's CSS variables on `documentElement` hold the latest value.
- Server model: renders a random list of sheets (plain and global, duplicates and clashing indexes) with `renderToString`, with and without `<StyleRegistry styles>`. Invariants: the `styles` array holds each index once with the first sheet, in first-use order, and `renderSheets` prints each `<style s:id>` once. A separate case checks that a render without a registry emits no `<style>`.
- `packages/solid-styled/vitest.config.ts`: three projects. `unit` runs the existing tests unchanged. `registry-client` runs the model file with the `browser` resolve condition and happy-dom. `registry-server` runs the same file on node.

## Proof

Not a fix node. Mutation check: changing `count > 1` to `count > 2` in `clientRemove` fails the client model with the minimal sequence `mount(a-1), mount(a-1), dispose(#0)`. The mutation was reverted.

## Deviations

- The brief lists `vitest.config.ts` as owned, and it was needed. `isServer` is fixed at import time and is true under both the plain node and happy-dom environments, so the client path needs the `browser` condition. The file runs in two projects, and `isServer` picks the block.
- Not covered: `<StyleRegistry auto>` (it goes through `useHead` and a full document render) and hydration of server-rendered tags (`tracked` seeded at import).
- No bug found in `core.ts`, so there is no `it.fails` case and no fix PR.
- No changeset (tests only).

## Stubs left

- None.

## Gotchas

- Solid 2 disposes memos that nothing observes. Children passed to `StyleRegistry` run only when read, and an unobserved `children()` memo is disposed on `flush()`, which runs the `onCleanup` and removes the sheet. The test reads them through `createEffect`.
- `fc.commands` with a `real` object that aliases the model double-registers state. The client test keeps all state in the model.
- Effects and cleanups need `flush()` from `solid-js` after each mount, dispose and update.
- `documentElement` CSS variables set by a global sheet are never unset when it unmounts. The test does not assert this either way.
- Under heavy machine load one full `pnpm test` run showed one failing test in the suite (not reproduced on re-runs, 13 s and 6 s). The model test takes about 0.2 to 1.2 s per project.

## Proposed learnings

- Tests that need the client build of Solid must run under the `browser` resolve condition in a vitest project | `isServer` is true under the default node and happy-dom setups | packages/solid-styled | yes

## Verification

- `pnpm format`, `pnpm build`, `pnpm test` (16 files, 238 tests pass), `pnpm lint`, `pnpm typecheck`, `pnpm format:check`: all pass.

## Size

- Estimated M, actual M. The Solid 2 root and children harness took most of the time.
