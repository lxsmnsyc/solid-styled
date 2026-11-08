# Outcome: chore-e2e-port

## Built

- `examples/demo/playwright.config.ts` picks a free port once with `node:net` (listen on 0), stores it in `PLAYWRIGHT_PORT`, and sets `reuseExistingServer: false`. `PLAYWRIGHT_PORT` set by the caller wins.

## Proof

- base: with a Node server answering "wrong app" on `localhost:4173`, `pnpm test:e2e` fails 9 of 9 tests (the server is reused).
- branch: the same server still on 4173, `pnpm test:e2e` passes 9 of 9 against the demo. Two `pnpm test:e2e` runs started at the same time from one worktree both passed 9 of 9.

## Deviations

- The parallel check ran two processes in one worktree, not two worktrees. The port logic does not depend on the worktree.

## Stubs left

- None.

## Gotchas

- A server on a wildcard address (python `http.server`) does not block vite on `localhost:4173` on macOS, so it does not reproduce the bug. Bind the fake server to `localhost`.
- The port is free when picked but not held. Another process could take it before vite starts. With `--strictPort` that fails loudly instead of testing the wrong app.
- The config uses top-level await. It works because the demo package is `"type": "module"`.

## Proposed learnings

- Never set `reuseExistingServer: true` for e2e web servers | it can test another project's app | examples | no

## Verification

- `pnpm format`, `pnpm format:check`, `pnpm lint`: pass.
- `pnpm test:e2e`: 9 passed, also with an unrelated server on 4173.
- CI sets `CI=true` and runs `pnpm --filter demo run test:e2e`. The config does not depend on the environment, so CI is unchanged.

## Size

- Estimated S, actual S.
