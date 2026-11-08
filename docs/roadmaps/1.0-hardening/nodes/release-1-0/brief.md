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

Exit Changesets pre mode, publish `1.0.0` under `latest`, and decide how `1.0` and `main` merge. Waits for Solid 2.0 stable. Refine when near.
