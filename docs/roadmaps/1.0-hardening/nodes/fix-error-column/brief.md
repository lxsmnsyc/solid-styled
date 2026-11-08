---
id: fix-error-column
status: todo
target: 1.0
ship: auto
size: S
gate: false
outline: false
title: Report 1-based column in CompileError (#49)
priority: must
type: fix
milestone: next.2
verify: pnpm --filter solid-styled test
owns:
  - packages/solid-styled/compiler/core/errors.ts
  - packages/solid-styled/test/output.test.ts
  - .changeset/fix-error-column.md
depends_on: []
---

# Report 1-based column in CompileError (#49)

## Goal

`CompileError.column` and the `(line:column)` in its message become 1-based, matching editors and `solid-sfc`.

## Context

- Source: https://github.com/lxsmnsyc/solid-styled/issues/49
- `packages/solid-styled/compiler/core/errors.ts`: `column = offset - (before.lastIndexOf('\n') + 1)`; add 1.

## Acceptance

- [ ] Test in `test/output.test.ts` ("should raise a located CompileError on a syntax error") checks `.column`, fails first, then passes.
- [ ] Changeset (patch) notes that `.column` is now 1-based.

## Sizing

S: one line plus a test.
