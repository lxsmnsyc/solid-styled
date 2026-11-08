---
id: bench-baseline
status: done
target: main
ship: auto
size: M
gate: true
outline: false
title: Compile benchmark and baseline profile
priority: should
type: spike
spike: true
milestone: 1.0
exclusive:
  - bench
owns:
  - benchmarks/**
shared:
  - pnpm-workspace.yaml
depends_on:
  - on: deps-update
    kind: hard
    why: baseline must be measured on the final dependency versions
---

# Compile benchmark and baseline profile

## Goal

Measure `compile()` with the perf-pass skill before changing anything, and find where time goes.

## Context

- Inputs: a small component, a large file with many templates, a file with no `css` (fast-path cost), a file with `:global` heavy sheets.
- Suspects to measure, not assume: `hires: true` source maps, css-tree parse + generate followed by a LightningCSS parse of the same sheet, browserslist resolution per call, full AST walk when the file never imports `solid-styled`, `MagicString` overhead.
- Also measure the unplugin `transform` filter (does it parse files without `css` at all?).

## Acceptance

- [ ] `benchmarks/` package with a runnable bench (`pnpm --filter benchmarks bench`), results with noise bounds in outcome.md.
- [ ] Ranked list of hotspots with profile evidence; this list sets the scope of `perf-compiler`. Gate: user reviews before perf-compiler starts.

## Sizing

M: bench harness plus profiling, no product code.
