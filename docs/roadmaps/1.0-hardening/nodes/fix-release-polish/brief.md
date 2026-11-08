---
id: fix-release-polish
title: Own error for an invalid browserslist, optional bundler options, remove env
status: done
priority: must
type: fix
milestone: next.2
target: main
ship: auto
size: M
gate: false
outline: false
added: 2026-11-08
fulfilled_by: '#73'
owns:
  - packages/solid-styled/compiler/**
  - packages/unplugin/src/**
depends_on: []
---

# Own error for an invalid browserslist, optional bundler options, remove env

Found while reviewing 1.0 before next.2. Also removes the unused `env` option.
