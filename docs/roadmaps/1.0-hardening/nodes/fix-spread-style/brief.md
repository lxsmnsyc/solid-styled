---
id: fix-spread-style
title: Merge scoped style variables with spread style props
status: done
priority: must
type: fix
milestone: next.2
target: main
ship: auto
size: M
gate: false
outline: false
added: 2026-11-08
fulfilled_by: '#71, #76'
owns:
  - packages/solid-styled/compiler/core/transform.ts
  - packages/solid-styled/src/core.ts
depends_on: []
---

# Merge scoped style variables with spread style props

Found by the oracle test (#70). A spread on a scoped element with variables could drop or overwrite the style variables. #71 merged them by copying the spread; review found it broke object literals, nested JSX, SVG and source maps. #76 replaced it with in-place insertions: `{...expr}` becomes `{..._spreadStyle(expr, vars)}`, and an explicit `style` before spreads becomes `_mergeStyles(style, vars())`. Recorded as an intended difference from 0.12.1.
