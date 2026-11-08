---
id: composition
status: todo
target: main
ship: auto
size: L
gate: false
outline: true
title: Static string composition in css templates (#33)
priority: later
type: feature
depends_on: []
---

# Static string composition in css templates (#33)

## Goal

Let `${expr}` insert static CSS text (rules, selectors) when the expression is a compile-time constant string, instead of always becoming a `var(--...)` read. Parked: needs a design for what counts as static and how it interacts with scoping.

- Source: https://github.com/lxsmnsyc/solid-styled/issues/33
