---
id: fix-global-in-selector-list
title: Keep :global entries of a selector list unscoped
status: todo
priority: should
type: fix
milestone: '1.0'
target: main
ship: auto
size: M
gate: false
outline: false
added: 2026-11-08
verify: pnpm --filter solid-styled test
owns:
  - packages/solid-styled/compiler/core/preprocess-css.ts
  - packages/solid-styled/compiler/core/process-scoped-sheet.ts
  - packages/solid-styled/test/global-selector/**
  - .changeset/fix-global-in-selector-list.md
depends_on:
  - on: spike-css-pipeline
    kind: hard
    why: the fix depends on which pipeline is kept
---

# Keep :global entries of a selector list unscoped

## Goal

`.a, :global(.b) { color: red; }` compiles to `[s\:c]:is(.a[s\:c],.b){color:red}`, so `.b` only matches inside the scope. The first LightningCSS pass rewrites the list to `:is(.a,:global(.b))`, and the scoping step then scopes the whole `:is()`. 0.12.1 has the same output (checked 2026-11-08), so this predates 1.0.

## Acceptance

- [ ] `.b` stays global and `.a` is scoped. The `it.fails` case in `test/properties.test.ts` (#69) becomes `it`, and the property no longer skips `:is`.
- [ ] Changeset (patch).
