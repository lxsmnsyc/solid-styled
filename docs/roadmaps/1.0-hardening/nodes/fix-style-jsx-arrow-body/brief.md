---
id: fix-style-jsx-arrow-body
title: Scope the style jsx setup call to an arrow function with an expression body
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
  - packages/solid-styled/compiler/core/transform.ts
  - packages/solid-styled/test/jsx.test.ts
  - .changeset/fix-style-jsx-arrow-body.md
depends_on:
  - on: fix-style-jsx-bare-expression
    kind: hard
    why: same insertion code in transform.ts
---

# Scope the style jsx setup call to an arrow function with an expression body

## Goal

For `const C = (props) => <div><style jsx>{...}</style></div>`, the setup call goes before the whole declaration, outside the component. 0.12.1 does the same. It runs once at module load, and `props` is not in scope. A nested arrow with an expression body already raises `CompileError` (`test/output.test.ts`); a top-level one compiles to wrong code. Listed in `docs/known-limits.md`.

## Acceptance

- [ ] Either rewrite the body to a block (`=> { setup(); return expr; }`), or raise the same `CompileError` as the nested case. Pick the rewrite if the source map stays correct.
- [ ] Tests for top-level and exported arrows.
- [ ] Update `docs/known-limits.md`.
- [ ] Changeset (patch).
