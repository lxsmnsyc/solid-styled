---
id: fix-type-only-import
title: Ignore type-only imports of css
status: done
priority: must
type: fix
milestone: next.2
target: 1.0
ship: auto
size: S
gate: false
outline: false
added: 2026-11-08
fulfilled_by: '#63'
owns:
  - packages/solid-styled/compiler/core/analyze.ts
depends_on: []
---

# Ignore type-only imports of css

Regression from 0.12.1, found by the `test-arbitraries` generators (#60) and reproduced against 0.12.1 on 2026-11-08. Fix in #63.
