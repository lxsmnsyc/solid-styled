---
id: release-next-2
status: active
target: main
ship: auto
size: S
gate: true
outline: false
title: Release 1.0.0-next.2
priority: must
type: release
milestone: next.2
owns: []
depends_on:
  - on: fix-export-arrow-style
    kind: hard
    why: ships it
  - on: fix-type-only-import
    kind: hard
    why: ships it
  - on: deps-update
    kind: hard
    why: ships it
  - on: fix-scope-shadowing
    kind: hard
    why: ships it
  - on: fix-error-column
    kind: hard
    why: ships it
  - on: fix-spread-style
    kind: hard
    why: ships it
  - on: fix-namespace-shadowing
    kind: hard
    why: ships it
  - on: fix-style-anchor-unbraced
    kind: hard
    why: ships it
  - on: fix-release-polish
    kind: hard
    why: ships it
---

# Release 1.0.0-next.2

## Goal

Merge the Changesets version PR (#77) that `release.yml` opens on `main`; the workflow publishes to npm under `next`. Maintainer merges it. Then close #49, #50 and, after approval, the answered support issues.
