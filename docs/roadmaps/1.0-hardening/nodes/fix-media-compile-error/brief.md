---
id: fix-media-compile-error
title: Throw CompileError for CSS errors from LightningCSS
status: todo
priority: should
type: fix
milestone: '1.0'
target: 1.0
ship: auto
size: S
gate: false
outline: false
added: 2026-11-08
verify: pnpm --filter solid-styled test
owns:
  - packages/solid-styled/compiler/core/preprocess-css.ts
  - packages/solid-styled/test/output.test.ts
  - .changeset/fix-media-compile-error.md
depends_on: []
---

# Throw CompileError for CSS errors from LightningCSS

## Goal

`${}` inside an `@media` query throws a plain LightningCSS `SyntaxError` ("Invalid media query"). The docs promise a `CompileError` with a location. Wrap LightningCSS errors in `CompileError` pointing at the template. 0.12.1 also rejects this input, so only the error type changes.

## Acceptance

- [ ] Test: the input throws `CompileError` with the template's line and column. Fails on `1.0` first.
- [ ] Changeset (patch).
