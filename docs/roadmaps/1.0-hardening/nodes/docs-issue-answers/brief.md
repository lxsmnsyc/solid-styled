---
id: docs-issue-answers
status: done
target: 1.0
ship: auto
size: M
gate: false
outline: false
title: 'Document answers to old issues (#19, #23, #26, #34, #40)'
priority: should
type: docs
milestone: '1.0'
owns:
  - docs/setup.md
  - docs/styling.md
  - docs/editor.md
  - README.md
depends_on: []
---

# Document answers to old issues

## Goal

Each old support issue gets a durable answer in `docs/`, so the issue can be closed with a link.

## Context

- #23, #34 (Astro, library packaging): document that `unplugin-solid-styled` must run on library sources, or libraries must ship compiled output; show `solidStyled.rollup()` for a component library and how to include a dependency in the Vite filter. Note FOUC limits with Astro islands.
- #26: `no-unused-expressions` with `allowTaggedTemplates: true` (ESLint, typescript-eslint); oxlint equivalent.
- #19: LightningCSS native binary does not load on StackBlitz (WebContainers). Document the limit; a wasm fallback is a separate `later` idea.
- #40: VS Code keybinding snippet for CSS comments inside `css` templates. New `docs/editor.md`, also syntax highlighting extension tips.
- Verify each claim against 1.0 code (option names, plugin exports) before writing.

## Acceptance

- [ ] Each issue maps to a docs section; outcome.md lists issue -> link, plus a draft close comment for each.
- [ ] Do not close issues; the orchestrator does that after user approval.

## Sizing

M: five topics, docs only.
