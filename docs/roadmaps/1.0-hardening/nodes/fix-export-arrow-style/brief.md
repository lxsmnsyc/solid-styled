---
id: fix-export-arrow-style
title: Emit valid code for exported arrow components with style jsx
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
fulfilled_by: '#64'
owns:
  - packages/solid-styled/compiler/core/transform.ts
depends_on: []
---

# Emit valid code for exported arrow components with style jsx

Regression from 0.12.1, found by the `test-arbitraries` generators (#60) and reproduced against 0.12.1 on 2026-11-08. Fix in #64.
