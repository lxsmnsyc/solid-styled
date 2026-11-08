# Outcome: deps-update

## Built

- Every dependency is at its latest version; `pnpm outdated -r` is empty.
- `solid-js` and `@solidjs/web` dev pins moved from `2.0.0-rc.5` to `2.0.0-rc.21` (solid-styled, demo). `@solidjs/vite-plugin` 3.0.0-next.57 needs `^2.0.0-rc.19`.
- Peer range stays `^2.0.0-rc.5`. Nothing in `src/core.ts` needed rc.21, so the range was not narrowed.
- Root `typescript` aligned to `^7.0.2`.
- New dev dependencies in `packages/solid-styled` for later test nodes: `fast-check`, `happy-dom`, `js-xxhash`, `solid-styled-legacy` (`npm:solid-styled@0.12.1`).
- `engines.node` in both packages is now `^20.19.0 || >=22.12.0`. It said `>=18`, but `oxc-parser` and `unplugin` already required 20.19 before this change.
- Changeset: `.changeset/deps-update.md` (patch).

## Checks

Build, lint, typecheck, format check, 211 unit tests and 9 Playwright tests pass. No snapshot changed, so LightningCSS and css-tree output is unchanged. No source file changed for the oxc-parser 0.148 to 0.157 bump.

## Gotchas

- `solid-styled-legacy` reports an unmet peer `solid-js@^1`. Only its compiler is loaded, so the warning is harmless. A `peerDependencyRules.allowedVersions` entry in `pnpm-workspace.yaml` did not silence `pnpm peers check` on pnpm 12, so none was added.
- Playwright 1.65 needs `pnpm exec playwright install chromium` locally once.
- `.changeset/config.json` has `baseBranch: main`, while releases run from `1.0`. Not changed here.
