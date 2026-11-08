# Outcome: docs-issue-answers

## Built

- #54: `docs/setup.md` (filters, component libraries, known limits), `docs/styling.md#linting`, new `docs/editor.md`.
- #56: corrections after review. The Astro section is replaced by a known limit, because `@astrojs/solid-js` 7.1.2 needs Solid 1.x. The README plugin order sentence now matches the code. README doc links point to `blob/1.0/docs/...`. The unused `env` option is removed (major changeset).
- Issues #19, #23, #26, #34, #40 are closed with answers written for 0.x.

## Findings

- 0.x `rollup-plugin-solid-styled` and `vite-plugin-solid-styled` CommonJS builds export `undefined` as default (0.11.1 and 0.12.1). This caused #34. Both packages are removed in 1.0.
- README doc links must switch from `blob/1.0` to `main` when `1.0` merges into `main` (release-1-0).
