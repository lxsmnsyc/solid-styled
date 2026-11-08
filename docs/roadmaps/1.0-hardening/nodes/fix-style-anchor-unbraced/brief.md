---
id: fix-style-anchor-unbraced
title: Place the style jsx setup call before an unbraced control body
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
fulfilled_by: '#74'
owns:
  - packages/solid-styled/compiler/core/transform.ts
depends_on: []
---

# Place the style jsx setup call before an unbraced control body

Found while reviewing 1.0. A `return` that was the unbraced body of `if`, `else`, a loop or a label got the setup call as its body. The call now goes before the outermost control statement, as in 0.12.1.
