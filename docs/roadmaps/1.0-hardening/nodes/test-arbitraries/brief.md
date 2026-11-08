---
id: test-arbitraries
status: todo
target: 1.0
ship: auto
size: M
gate: false
outline: false
title: fast-check generators for compiler inputs
priority: should
type: contract
milestone: 1.0
verify: pnpm --filter solid-styled test
owns:
  - packages/solid-styled/test/arbitraries.ts
  - packages/solid-styled/test/arbitraries.test.ts
shared: []
provides:
  - test-arbitraries
depends_on:
  - on: deps-update
    kind: hard
    why: the dev dependencies this node uses are added by deps-update
---

# fast-check generators for compiler inputs

## Goal

Add `fast-check` and the generators in `contracts/test-arbitraries.md`, so the oracle and property nodes share one input space.

## Acceptance

- [ ] `test/arbitraries.test.ts` checks that every generated module parses with `oxc-parser` and every generated template compiles without throwing (or throws `CompileError` only for the documented invalid cases).
- [ ] Generators are seeded and shrink well (no giant strings); default `numRuns` keeps `pnpm test` under 10 s extra.

## Sizing

M: generator design is the work.
