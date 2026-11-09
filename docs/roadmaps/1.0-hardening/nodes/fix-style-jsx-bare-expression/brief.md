---
id: fix-style-jsx-bare-expression
title: Emit valid code for style jsx outside a JSX parent
status: todo
priority: should
type: fix
milestone: '1.0'
target: main
ship: auto
size: M
gate: false
outline: false
added: 2026-11-08
verify: pnpm --filter solid-styled test
owns:
  - packages/solid-styled/compiler/core/transform.ts
  - packages/solid-styled/test/jsx.test.ts
  - .changeset/fix-style-jsx-bare-expression.md
depends_on: []
---

# Emit valid code for style jsx outside a JSX parent

## Goal

The compiler removes a `<style jsx>` element and leaves the code around it. When the element is not a child of an element or fragment, `return (<style jsx>...</style>);` becomes `return ();` and `() => <style jsx>...</style>` becomes `() => ;`, which do not parse. A bare `return <style jsx>...</style>;` becomes `return ;`. 0.12.1 fails on these too. Listed in `docs/known-limits.md`.

## Acceptance

- [ ] An expression-position `<style jsx>` is replaced with `null`, so the output parses and renders nothing. The setup call still runs.
- [ ] Tests for the parenthesized return, the bare return and the arrow body.
- [ ] Remove the entry from `docs/known-limits.md`.
- [ ] Changeset (patch).
