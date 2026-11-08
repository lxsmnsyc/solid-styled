---
id: chore-e2e-port
title: Stop e2e tests from reusing another project's server
status: done
priority: should
type: chore
milestone: '1.0'
target: main
ship: auto
size: S
gate: false
outline: false
added: 2026-11-08
verify: pnpm build && pnpm test:e2e
owns:
  - examples/demo/playwright.config.ts
depends_on: []
---

# Stop e2e tests from reusing another project's server

## Goal

`examples/demo/playwright.config.ts` uses port 4173 with `reuseExistingServer: !process.env.CI`. Locally, a server from another project on 4173 (seen 2026-11-08, a solid-sfc worktree) is reused, so the tests can run against the wrong app. Use a port unlikely to collide, or a free port, and keep CI behavior.

## Acceptance

- [ ] With an unrelated server on 4173, `pnpm test:e2e` still tests the demo.
