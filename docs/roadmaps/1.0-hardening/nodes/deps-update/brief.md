---
id: deps-update
status: done
target: main
ship: auto
size: M
gate: false
outline: false
title: Update all dependencies
priority: must
type: chore
milestone: next.2
verify: pnpm install --frozen-lockfile && pnpm build && pnpm test && pnpm lint && pnpm typecheck
owns:
  - package.json
  - pnpm-lock.yaml
  - pnpm-workspace.yaml
  - packages/solid-styled/package.json
  - packages/unplugin/package.json
  - examples/demo/package.json
  - .changeset/deps-update.md
provides: []
depends_on: []
---

# Update all dependencies

## Goal

Bring every dependency on `1.0` to its latest version, fix what breaks, and keep all checks green. `pnpm-lock.yaml` is a hot file, so this lands first; later nodes that add dev dependencies rebase on it.

## Context

`pnpm outdated -r` on 2026-11-08 (`9bde903`):

- solid-js / @solidjs/web `2.0.0-rc.5` -> `2.0.0-rc.21` (peer range too: `^2.0.0-rc.5` stays valid but test and demo should use rc.21)
- @solidjs/vite-plugin `3.0.0-next.37` -> `3.0.0-next.57`
- oxc-parser `0.148.0` -> `0.157.0` (AST shape changes possible; analyze.ts reads node types directly)
- magic-string `1.2.3` -> `1.4.5`, browserslist `4.28.8` -> `4.29.5`, unplugin `3.3.0` -> `3.7.0`
- vitest `4.1.11` -> `5.1.0` (major), tsdown `0.22` -> `0.23`, vite `8.2` -> `8.3`
- oxlint `1.81` -> `1.92`, oxfmt `0.66` -> `0.77`, @types/node, tslib
- root `typescript` is `^6.0.3` while packages use `^7.0.2`: align on 7.
- Also check lightningcss, css-tree, @playwright/test, @changesets/cli, @lxsmnsyc/oxlint-config.

## Acceptance

- [ ] Adds the dev dependencies later test nodes need, so they never touch the lockfile: `fast-check`, `happy-dom`, `solid-styled-legacy` (`npm:solid-styled@0.12.1`), and a reference xxhash32 (`js-xxhash` or `xxhash-wasm`) in `packages/solid-styled`.
- [ ] `pnpm outdated -r` lists nothing (or each leftover has a reason in outcome.md).
- [ ] Full check passes, including `pnpm test:e2e` and `pnpm format:check` (reformat if oxfmt output changed, in a separate commit).
- [ ] Snapshot changes, if any, are explained in outcome.md (they would mean LightningCSS or css-tree output changed).
- [ ] Changeset (patch) for `solid-styled` and `unplugin-solid-styled` dependency bumps.

## Sizing

M: many bumps, two majors (vitest 5, Solid rc jump), mechanical otherwise.

## Notes for the worker

- If Solid rc.21 changes `useHead`, context defaults or `isServer`, fix `packages/solid-styled/src/core.ts` and list it in outcome.md.
- Do not change compiler logic beyond what the oxc AST bump forces.
