---
id: perf-fast-path
title: Skip files that cannot contain styles
status: todo
priority: should
type: refactor
milestone: '1.0'
target: main
ship: auto
size: S
gate: false
outline: false
exclusive: [bench]
verify: pnpm build && pnpm test && pnpm test:e2e
owns:
  - packages/unplugin/src/**
  - .changeset/perf-fast-path.md
depends_on:
  - on: bench-baseline
    kind: hard
    why: the baseline numbers prove the gain
---

# Skip files that cannot contain styles

## Goal

`transform` parses and walks every file that passes the path filter and returns a hires map for unchanged code (0.77 ms per unstyled file). Return early when the code contains neither `solid-styled` nor `<style`, and use unplugin's `transform.filter.code` where the bundler supports it.

## Acceptance

- [ ] A file without `solid-styled` or `<style` returns no transform result. `<style jsx>` without any import still compiles (test it).
- [ ] Measured: unstyled file cost drops from about 0.77 ms to near zero.
- [ ] Changeset (patch) for `unplugin-solid-styled`.
