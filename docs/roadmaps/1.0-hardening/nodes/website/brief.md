---
id: website
status: todo
target: main
ship: auto
size: L
gate: false
outline: true
title: Project website
priority: should
type: feature
milestone: 1.0
depends_on:
  - on: docs-issue-answers
    kind: hard
    why: site content comes from docs/
---

# Project website

## Goal

The project has no website. Build one in `website/`: a private workspace app on Solid 2.0 and `@solidjs/vite-plugin`, styled with solid-styled itself. It holds a landing page, the guides from `docs/` and live examples. Deployed on Vercel.

## Notes

- Decided with the user on 2026-11-08: new site, Solid 2.0, `@solidjs/vite-plugin`.
- Refine into briefs (scaffold and routing, docs rendering, landing page, deploy) with the ui-style skill when `plan.py refine` lists it.
- Add `website` to `pnpm-workspace.yaml` packages (today it lists only `packages/**` and `examples/**`).
