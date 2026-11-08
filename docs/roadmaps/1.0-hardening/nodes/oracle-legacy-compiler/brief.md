---
id: oracle-legacy-compiler
status: active
target: 1.0
ship: auto
size: M
gate: false
outline: false
title: Differential test against solid-styled@0.12.1 compiler
priority: should
type: feature
milestone: 1.0
verify: pnpm --filter solid-styled test
owns:
  - packages/solid-styled/test/oracle.test.ts
shared: []
depends_on:
  - on: deps-update
    kind: hard
    why: the dev dependencies this node uses are added by deps-update
  - on: test-arbitraries
    kind: contract
    via: test-arbitraries
  - on: fix-scope-shadowing
    kind: hard
    why: 0.12.1 uses Babel scope bindings, so the oracle disagrees on #50 cases until the fix lands
---

# Differential test against the 0.12.1 compiler

## Goal

The 1.0 compiler claims byte-for-byte equal stylesheets, scope ids and runtime calls to the Babel compiler of 0.12.1. Turn that claim into a property: for generated modules, both compilers produce the same result.

## Context

- `solid-styled-legacy` (`npm:solid-styled@0.12.1`) is installed by deps-update. Its compiler is at `solid-styled-legacy/compiler` (async, Babel, returns `{ code, map }`).
- Compare normalized output: format both with the same printer, or compare the extracted sheet strings, scope ids and import specifiers instead of raw code. Decide and document in outcome.md.
- Known intended differences (from `.changeset/oxc-compiler-rewrite.md`): query string ignored in the scope hash, `CompileError` vs Babel errors, unit-after-interpolation fix. Filter these out explicitly, each with a comment.

## Acceptance

- [ ] Property runs in `pnpm test` with a fixed seed and at least 200 runs; any counterexample found while building is either fixed in a separate fix PR or recorded as an intended difference.
- [ ] outcome.md lists every intended difference.

## Sizing

M: oracle wiring and normalization.
