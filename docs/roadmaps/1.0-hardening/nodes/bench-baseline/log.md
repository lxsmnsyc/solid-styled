# Log: bench-baseline

- Branched `chore/bench-baseline` from `origin/1.0` at 722da29 (deps-update and fix-scope-shadowing merged).
- Picked tinybench 6.2.3. Vitest `bench` runs on it, so it was already in the lockfile. It runs in plain Node, so `node --cpu-prof` profiles the same code path without vitest workers.
- Wrote the scripts in TypeScript. Node 26 strips types, so they run with `node file.ts` and no build step. A nested `benchmarks/oxlint.config.ts` extends the root config, skips the fixtures (compiler input) and allows `console`.
- First runs were on a loaded machine (load average 20 to 35 on 8 cores, other agents running tests). `compile large` medians moved from 23 ms to 99 ms between runs. Final numbers were taken after waiting for the load to drop, and repeated across processes with bench.py.
- `pnpm profile` collides with the pnpm `profile` command, so the script is `bench:profile`.
- The raw attribution counted startup and module loading. The attribution now keeps only samples whose stack runs through `compile()`.
- LightningCSS's `browserslistToTargets` (in `lightningcss/node/browserslistToTargets.js`) is charged to browserslist resolution, not to the LightningCSS transform.
- Wrapping `browserslist` through the require cache did not catch the compiler's calls. `browserslistToTargets` is wrapped instead. Both run in the same expression in `preprocess-css.ts`.
