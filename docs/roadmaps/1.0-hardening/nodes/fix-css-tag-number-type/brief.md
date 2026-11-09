---
id: fix-css-tag-number-type
title: Accept numbers in the css tag type
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
  - packages/solid-styled/src/core.ts
  - packages/solid-styled/test/types/**
  - .changeset/fix-css-tag-number-type.md
depends_on: []
---

# Accept numbers in the css tag type

## Goal

The `css` tag type accepts only `string` and `boolean` interpolations, so `` css`width: ${4}px` `` fails with `TS2345`. The compiled output works. Widen the type to include `number`. Check that `chore-typecheck-tests` covers it, or add a type test here. Listed in `docs/known-limits.md`.

## Acceptance

- [ ] `number` interpolations type-check.
- [ ] Remove the entry from `docs/known-limits.md`.
- [ ] Changeset (patch).
