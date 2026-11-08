---
id: perf-compiler
title: Speed up compiler internals
status: todo
priority: should
type: refactor
milestone: '1.0'
target: main
ship: auto
size: M
gate: false
outline: false
exclusive: [bench]
verify: pnpm --filter solid-styled test
owns:
  - packages/solid-styled/compiler/**
  - .changeset/perf-compiler.md
depends_on:
  - on: bench-baseline
    kind: hard
    why: fixes and expected gains come from its ranked hotspots
  - on: test-arbitraries
    kind: hard
    why: the generators guard that output stays the same
---

# Speed up compiler internals

## Goal

Apply the fixes the maintainer picked from `bench-baseline` (2026-11-08). Compiler output must not change.

## Steps

- [ ] Cache LightningCSS targets per browserslist query (`browserslistToTargets` runs twice per sheet).
- [ ] Replace the generic `Object.keys` child walk in `analyze.ts` with a child-key table per node type.
- [ ] Reuse one `TextEncoder` and `TextDecoder`; make `Ctx.unique()` not probe from 1 on every call.
- [ ] Enable oxc `experimentalRawTransfer` (approved). Add a local type for the option. Note the ~6.4 GB address-space reservation in outcome.md and check it does not break on low-memory CI.

## Acceptance

- [ ] Each step measured with `benchmarks/` against the baseline on a quiet machine (no other agents running). Report gains with noise; a step within noise is reverted.
- [ ] All tests, snapshots and the generator properties pass unchanged.
- [ ] Hires source maps stay (maintainer decision).

## Notes for the worker

- Out of scope: single-pass LightningCSS scoping (blocked by lightningcss #480 and #595, see `spike-css-pipeline`) and source map changes.
