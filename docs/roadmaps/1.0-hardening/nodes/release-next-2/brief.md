---
id: release-next-2
status: active
target: 1.0
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
  - on: deps-update
    kind: hard
    why: ships it
  - on: fix-scope-shadowing
    kind: hard
    why: ships it
  - on: fix-error-column
    kind: hard
    why: ships it
---

# Release 1.0.0-next.2

## Goal

Merge the Changesets version PR that `release.yml` opens on `1.0`; the workflow publishes to npm under `next`. Maintainer merges it. Then close #49, #50 and, after approval, the answered support issues.
