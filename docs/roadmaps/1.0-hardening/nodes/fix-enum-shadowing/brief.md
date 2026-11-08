---
id: fix-enum-shadowing
title: Treat a local TypeScript enum named css as a shadowing binding
status: done
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
  - packages/solid-styled/compiler/core/analyze.ts
  - packages/solid-styled/test/scoping.test.ts
  - .changeset/fix-enum-shadowing.md
depends_on: []
---

# Treat a local TypeScript enum named css as a shadowing binding

## Goal

`enum css {}` declared inside a function should shadow the `css` import, like `let css`. `hoistStatements` in `analyze.ts` skips `TSEnumDeclaration`.

## Context

- Found by the worker of `fix-scope-shadowing` (#57). See its outcome.md.
- `namespace` is only valid at the top level, where it would clash with the import, so only `enum` matters.

## Acceptance

- [ ] A test shows the template is compiled on `1.0` and left as is after the fix.
- [ ] Changeset (patch).

## Sizing

S: one declaration type plus a test.
