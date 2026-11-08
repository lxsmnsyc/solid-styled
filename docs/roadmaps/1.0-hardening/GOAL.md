---
milestones: [next.2, '1.0']
run: parallel
review: auto
merge:
  mode: maintainer
# Releases publish whatever changesets are on 1.0 when the version PR merges.
# Work does not wait for a publish, so the fence covers only pre.json.
release:
  publish: changesets
  paths: [.changeset/pre.json]
  fence: merge
---

# solid-styled 1.0 hardening

## Outcome

The `1.0` branch ships `1.0.0-next.2` with current dependencies (Solid 2.0 rc.21, oxc-parser 0.157) and fixes for every open compiler bug (#49, #50). Before the stable `1.0.0`, the compiler is covered by property-based, model-based and oracle tests, its compile time is measured and improved with evidence, and the project has a redesigned website.

## Acceptance

- `pnpm install --frozen-lockfile && pnpm build && pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e` passes on `1.0`.
- Issues #49 and #50 are closed by merged PRs. Issues #19, #23, #26, #33, #34 and #40 have an answer or a parked node.
- The differential test against `solid-styled@0.12.1` and the property tests run in `pnpm test`.
- A benchmark in `benchmarks/` reports compile time before and after the perf work.

## Priorities

- must: needed for `1.0.0-next.2` (deps, open compiler bugs).
- should: needed for stable `1.0.0` (tests, perf, website, issue answers).
- could: nice to have before `1.0.0`.
- later: parked feature requests.

## Constraints

- All PRs target `main`. Since 2026-11-08, `main` holds 1.0 (moved from the `1.0` branch) and `0.x` holds the 0.x line in maintenance mode: no new features there.
- Compiler output stays byte for byte the same as 0.12.1 for inputs both compilers accept, unless a node fixes a bug in that output (then the changeset says so).
- The repo is public, so CI runs on PRs. Open PRs as drafts until the review is clean.
- Changesets in pre mode (`next` tag). Every user-facing change adds a changeset.

## Non-goals

- Changes to `main` or 0.x releases.
- Arbitrary string interpolation in `css` templates (#33). Parked as `later`.
- Astro integration package.

## Verification

- Fast check: `pnpm build && pnpm test && pnpm lint && pnpm typecheck` (about 30 s, no shared resources).
- Full check: fast check plus `pnpm format:check && pnpm test:e2e` (Playwright, uses port of the demo preview server, one at a time).

## Numbered resources

- None. Changeset file names are free-form; use the node id as the name.

## Sources

- Open issues: #19, #23, #26, #33, #34, #40, #49, #50.
- PR #43 (`1.0` branch description).

## Coverage

- update dependencies -> deps-update
- fix submitted issues: #50 -> fix-scope-shadowing; #49 -> fix-error-column; #19, #23, #26, #34, #40 -> docs-issue-answers; #33 -> composition (later)
- PBT/MBT/oracle -> test-arbitraries, oracle-legacy-compiler, pbt-css-scoping, mbt-style-registry
- perf improvements -> bench-baseline, perf-compiler
- website redesign -> website (no site exists; new `website/` app on Solid 2.0 and `@solidjs/vite-plugin`, decided 2026-11-08)
- release -> release-next-2, release-1-0

## Open questions

- Closing old issues is outward-facing: confirm before the orchestrator closes #19, #23, #26, #34, #40.

## Gates

- `bench-baseline` (numbers decide the perf scope).
- Release nodes (the maintainer merges the Changesets version PR).
