---
id: fix-nesting-in-global
title: Keep & in nested rules inside @global
status: todo
priority: should
type: fix
milestone: '1.0'
target: main
ship: auto
size: M
gate: false
outline: false
added: 2026-11-08
verify: pnpm --filter solid-styled test
owns:
  - packages/solid-styled/compiler/core/preprocess-css.ts
  - packages/solid-styled/compiler/core/process-scoped-sheet.ts
  - packages/solid-styled/test/global-selector/nested.test.ts
  - .changeset/fix-nesting-in-global.md
depends_on:
  - on: fix-global-in-selector-list
    kind: hard
    why: same two files
---

# Keep & in nested rules inside @global

## Goal

`@global { .a { &.on { color: blue; } } }` compiles to `.a .on{...}`, so `.on` matches a descendant instead of the same element. `& > .b` loses its `&` too, and some outputs do not parse. LightningCSS leaves the body of the custom `@global` rule unparsed, so its nesting is never lowered, and the `&` is lost later. 0.12.1 has the same output (checked 2026-11-08).

## Acceptance

- [ ] `&.on` inside `@global` compiles to `.a.on`, and `& > .b` to `.a>.b`. The `it.fails` case in `test/properties.test.ts` (#69) becomes `it`, and the property no longer skips nested `&`.
- [ ] Changeset (patch).
