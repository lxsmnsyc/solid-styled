---
id: fix-scope-shadowing
status: todo
target: 1.0
ship: auto
size: M
gate: false
outline: false
title: Respect css shadowed by nested var, switch case let, class expression name (#50)
priority: must
type: fix
milestone: next.2
verify: pnpm --filter solid-styled test
owns:
  - packages/solid-styled/compiler/core/analyze.ts
  - packages/solid-styled/test/scoping.test.ts
  - packages/solid-styled/test/__snapshots__/scoping.test.ts.snap
  - .changeset/fix-scope-shadowing.md
depends_on:
  - on: deps-update
    kind: hard
    why: oxc-parser bump can change the AST node shapes analyze.ts walks
---

# Respect `css` shadowed by nested `var`, switch-case `let`, class expression name (#50)

## Goal

`analyze` must not compile a `css` template whose `css` binding is a local, not the import. Fix the three cases in issue #50.

## Context

- Source: https://github.com/lxsmnsyc/solid-styled/issues/50 (has repro steps and cause).
- `hoistStatements` reads only direct block statements, so `var` in nested blocks lands in the wrong scope. `enterScope` has no case for `SwitchStatement` or `ClassExpression`.
- Also check while there: `for (var css ...)`, `catch (css)`, function expression names, `for (let css of ...)`, labeled blocks, destructured `var { css } = o` in nested blocks.

## Acceptance

- [ ] Failing tests for the three rows of #50 are written first and shown failing on `1.0`, then pass.
- [ ] Extra cases above are covered by tests.
- [ ] Changeset (patch): `fix: ...` referencing #50.

## Sizing

M: one file, scope logic is subtle.
