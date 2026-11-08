---
id: spike-css-pipeline
title: Decide the CSS pipeline (LightningCSS, css-tree, PostCSS)
status: todo
priority: should
type: spike
spike: true
gate: true
milestone: '1.0'
target: main
ship: auto
size: M
outline: false
exclusive: [bench]
owns:
  - benchmarks/css-pipeline/**
depends_on:
  - on: oracle-legacy-compiler
    kind: hard
    why: output comparison against 0.12.1 decides which options keep the sheets the same
---

# Decide the CSS pipeline

## Goal

Each scoped sheet goes through LightningCSS (lower nesting), css-tree (scoping), then LightningCSS again (minify). That is about a third of compile time. Find out which pipeline to keep. Measure, do not ship.

## Context

- LightningCSS cannot do the scoping itself. Checked on 1.33.0 (2026-11-08):
  - parcel-bundler/lightningcss#480: `RuleExit` never fires for custom at-rules, so a visitor cannot track `@global` depth (enters 1, exits 0).
  - parcel-bundler/lightningcss#595: `:global(...)` arguments arrive as raw tokens with whitespace tokens, not as selectors.
  - parcel-bundler/lightningcss#408 (`border: none` in visitors) is fixed.
- The maintainer wants PostCSS considered as a fallback in case LightningCSS keeps blocking.

## Options to compare

1. Today's pipeline.
2. Drop one LightningCSS pass, if output stays the same.
3. PostCSS with `postcss-selector-parser` for scoping instead of css-tree, LightningCSS kept for lowering and minify.
4. Full PostCSS (`postcss-nesting`, `postcss-preset-env`, `cssnano`) with no LightningCSS. Pure JS, so it would also run on StackBlitz (#19).
5. `lightningcss-wasm` as a fallback where the native binary does not load.

## Known bugs each option must handle

- `.a, :global(.b)`: LightningCSS wraps the list in `:is()`, so `.b` gets scoped (node `fix-global-in-selector-list`).
- Nesting inside `@global`: LightningCSS does not parse the custom at-rule body, and the `&` is lost (node `fix-nesting-in-global`).

## Acceptance

- [ ] For each option: whether it fixes the two bugs above, compile time on the benchmark fixtures, sheet bytes identical to 0.12.1 or not (oracle), install size, StackBlitz support.
- [ ] A recommendation in outcome.md. Gate: the maintainer picks before any rewrite node is written.
