---
id: release-1-0
status: todo
target: 1.0
ship: auto
size: S
gate: true
outline: true
title: Release 1.0.0
priority: should
type: release
milestone: 1.0
owns: []
depends_on:
  - on: fix-nesting-in-global
    kind: hard
    why: ships it
  - on: fix-global-in-selector-list
    kind: hard
    why: ships it
  - on: chore-typecheck-tests
    kind: hard
    why: ships it
  - on: chore-e2e-port
    kind: hard
    why: ships it
  - on: fix-media-compile-error
    kind: hard
    why: ships it
  - on: spike-css-pipeline
    kind: hard
    why: ships it
  - on: perf-fast-path
    kind: hard
    why: ships it
  - on: fix-enum-shadowing
    kind: hard
    why: ships it
  - on: oracle-legacy-compiler
    kind: hard
    why: ships it
  - on: pbt-css-scoping
    kind: hard
    why: ships it
  - on: mbt-style-registry
    kind: hard
    why: ships it
  - on: perf-compiler
    kind: hard
    why: ships it
  - on: website
    kind: hard
    why: ships it
  - on: test-arbitraries
    kind: hard
    why: ships it
  - on: bench-baseline
    kind: hard
    why: ships it
---

# Release 1.0.0

## Goal

Exit Changesets pre mode, publish `1.0.0` under `latest`, and decide how `1.0` and `main` merge. Waits for Solid 2.0 stable. Switch README doc links from `blob/1.0` to `main` when `1.0` merges into `main`. Refine when near.
