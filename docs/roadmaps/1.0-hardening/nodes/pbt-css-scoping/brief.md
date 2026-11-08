---
id: pbt-css-scoping
status: done
target: main
ship: auto
size: M
gate: false
outline: false
title: Property tests for scoped sheet processing and xxhash32
priority: should
type: feature
milestone: 1.0
verify: pnpm --filter solid-styled test
owns:
  - packages/solid-styled/test/properties.test.ts
depends_on:
  - on: test-arbitraries
    kind: contract
    via: test-arbitraries
---

# Property tests for scoped sheet processing and xxhash32

## Goal

Properties over `processScopedSheet`, `processCSSTemplate` and `xxHash32`:

- Every compound selector outside `:global(...)` carries the scope attribute exactly once; selectors inside `:global` are unchanged.
- Output parses with LightningCSS and css-tree; processing is deterministic.
- Every `${}` maps to exactly one `var(--...)` and the vars list order matches template order; units after an interpolation survive.
- `@keyframes` names are namespaced and every `animation`/`animation-name` reference is renamed consistently.
- `xxHash32` matches a reference implementation (e.g. `xxhash-wasm` or `js-xxhash`, devDependency) for random strings, including non-ASCII.

## Acceptance

- [ ] Each property is one `it` with a fixed seed; counterexamples found become regression tests and separate fix PRs.

## Sizing

M: five properties on existing code.
