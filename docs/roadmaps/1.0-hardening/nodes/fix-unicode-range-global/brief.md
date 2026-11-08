---
id: fix-unicode-range-global
title: Keep unicode-range values inside @global
status: todo
priority: should
type: fix
milestone: '1.0'
target: main
ship: auto
size: S
gate: false
outline: false
added: 2026-11-08
verify: pnpm --filter solid-styled test
owns:
  - packages/solid-styled/compiler/core/preprocess-css.ts
  - packages/solid-styled/compiler/core/process-scoped-sheet.ts
  - packages/solid-styled/test/global-selector/unicode-range.test.ts
  - .changeset/fix-unicode-range-global.md
depends_on:
  - on: fix-nesting-in-global
    kind: hard
    why: same two files
---

# Keep unicode-range values inside @global

## Goal

In a `@global` block of a `css` template, `unicode-range: U+0000-00FF` compiles to `U0-0FF`, which browsers drop. Scoped sheets and `<style jsx global>` keep the value. Find which pass loses the `+` (css-tree generate of the global block is the first suspect). Listed in `docs/known-limits.md`.

## Acceptance

- [ ] The value survives inside `@global` as in a scoped sheet.
- [ ] Remove the entry from `docs/known-limits.md`.
- [ ] Changeset (patch).
