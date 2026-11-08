---
id: perf-compiler
status: todo
target: 1.0
ship: auto
size: L
gate: false
outline: true
title: Speed up compile hot paths
priority: should
type: refactor
milestone: 1.0
depends_on:
  - on: bench-baseline
    kind: hard
    why: scope comes from the measured hotspots
  - on: fix-scope-shadowing
    kind: hard
    why: both edit compiler/core/analyze.ts
  - on: oracle-legacy-compiler
    kind: hard
    why: the oracle guards output equality during perf rewrites
---

# Speed up compile hot paths

## Goal

Apply the perf-pass fixes picked from `bench-baseline`, each measured against the baseline, with output unchanged (oracle and snapshots green). Refine into briefs once the baseline lands.
