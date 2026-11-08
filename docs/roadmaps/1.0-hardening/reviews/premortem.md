# Premortem

Assume the roadmap failed. Likely reasons and mitigations:

1. Solid 2.0 rc.21 changes runtime APIs (`useHead`, context, `isServer`) and deps-update balloons. Mitigation: deps-update may split the Solid bump into its own PR if it touches `src/core.ts` beyond a few lines.
2. oxc-parser 0.157 changes AST shapes, and fix-scope-shadowing rebuilds on moving ground. Mitigation: hard edge deps-update -> fix-scope-shadowing.
3. The 0.12.1 oracle disagrees on many cases that are intended differences, and the test becomes a long allow-list. Mitigation: compare normalized artifacts (sheets, scope ids), not raw code; list differences in outcome.md; drop to a fixture-corpus oracle if the list passes 10 entries.
4. Property tests are slow or flaky and get skipped. Mitigation: fixed seeds, bounded sizes, under 10 s extra in `pnpm test`.
5. Website scope is unknown and absorbs the 1.0 release. Mitigation: outline node, blocked on the open question in GOAL.md; release-1-0 can drop it with user approval.

Blindspot checklist: security N/A (no new inputs); migrations N/A; numbered resources none; hot files: lockfile and package.json owned by deps-update only (later nodes get their dev dependencies from it); single-use resource: benchmarks (`exclusive: [bench]`), Playwright port (full check only).
