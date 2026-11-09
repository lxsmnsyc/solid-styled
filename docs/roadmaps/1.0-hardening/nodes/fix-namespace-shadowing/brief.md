---
id: fix-namespace-shadowing
title: Respect css shadowed inside a TypeScript namespace or parameter property
status: done
priority: must
type: fix
milestone: next.2
target: main
ship: auto
size: S
gate: false
outline: false
added: 2026-11-08
fulfilled_by: '#72'
owns:
  - packages/solid-styled/compiler/core/analyze.ts
depends_on: []
---

# Respect css shadowed inside a TypeScript namespace or parameter property

Found while reviewing 1.0. Namespace shadowing worked in 0.12.1 and was lost in 1.0; parameter properties were never handled.
