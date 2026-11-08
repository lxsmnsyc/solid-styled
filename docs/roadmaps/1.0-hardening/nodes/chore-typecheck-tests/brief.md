---
id: chore-typecheck-tests
title: Typecheck test files and vitest config
status: todo
priority: should
type: chore
milestone: '1.0'
target: 1.0
ship: auto
size: S
gate: false
outline: false
added: 2026-11-08
verify: pnpm typecheck
owns:
  - packages/solid-styled/tsconfig.json
  - packages/solid-styled/test/**
depends_on:
  - on: test-arbitraries
    kind: hard
    why: avoid conflicting edits in test/ while it is open
  - on: mbt-style-registry
    kind: hard
    why: avoid conflicting edits in test/ while it is open
---

# Typecheck test files and vitest config

## Goal

`packages/solid-styled/tsconfig.json` excludes `test/**.test.ts` and does not include `vitest.config.ts`, so `pnpm typecheck` never checks tests. Include them (a separate `tsconfig.test.json` is fine) and fix the type errors that show up.

## Acceptance

- [ ] `pnpm typecheck` checks every file under `test/` and `vitest.config.ts`, and passes.
