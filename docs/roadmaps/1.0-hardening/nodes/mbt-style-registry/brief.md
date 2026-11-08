---
id: mbt-style-registry
status: done
target: main
ship: auto
size: M
gate: false
outline: false
title: Model-based test of StyleRegistry insert/remove
priority: should
type: feature
milestone: 1.0
verify: pnpm --filter solid-styled test
owns:
  - packages/solid-styled/test/registry.model.test.ts
  - packages/solid-styled/vitest.config.ts
shared: []
depends_on:
  - on: deps-update
    kind: hard
    why: the dev dependencies this node uses are added by deps-update
---

# Model-based test of StyleRegistry insert/remove

## Goal

`src/core.ts` keeps a reference count per sheet id and inserts or removes `<style>` tags. That is a state machine; test it with `fc.commands` against a model (`Map<id, count>`).

## Context

- Commands: mount component with sheet id X, unmount it, mount global sheet with vars, update vars, mount under `ServerStyleRegistry` and `renderSheets`.
- Invariants after each command: one `<style>` per id with count > 0, none for count 0, content equals the sheet, server output contains each sheet once.
- Uses `happy-dom` (installed by deps-update) for the client path, scoped to this test file.

## Acceptance

- [ ] Model test runs in `pnpm test`; any bug found becomes a separate fix PR with a regression test.

## Sizing

M: harness for Solid 2 roots plus command set.
