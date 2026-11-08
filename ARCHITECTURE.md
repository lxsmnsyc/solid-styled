# Architecture

A map of the code for contributors. For what the compiler outputs and why, read [How it works](./docs/how-it-works.md) first.

## Packages

- `packages/solid-styled`: the compiler (`compiler/`, published as `solid-styled/compiler`) and the runtime (`src/`, published as `solid-styled`).
- `packages/unplugin`: `unplugin-solid-styled`, the bundler plugins. It filters files and calls `compile`. The Vite entry also moves its plugin in front of the Solid JSX plugin, so styles compile before Solid compiles the JSX.
- `examples/demo`: a Vite app with the Playwright tests (`pnpm test:e2e`).
- `benchmarks`: compile time benchmarks and profiling scripts.

## Compiler

`compile(id, code, options)` in `compiler/index.ts` is synchronous. It parses the module with oxc, runs `analyze`, then `transform`, and returns the code and a source map from magic-string. Parse errors and CSS errors are thrown as `CompileError`, with a 1-based line and column.

The files in `compiler/core/`:

- `analyze.ts`: one walk in document order. It collects the `css` and `<style jsx>` templates, every JSX element with its chain of enclosing functions, and the `use:solid-styled` attributes. It tracks scopes only to tell whether `css` still refers to the `solid-styled` import.
- `context.ts`: `Ctx`, the state of one compile. It holds the MagicString, the analysis, the runtime imports to add, and the sheet and variable holders of each function.
- `transform.ts`: applies the edits. It replaces each `css` template with a setup call and places the `<style jsx>` setup call before its statement. It adds the `s:<scope>` marker to host elements and merges `vars_N()` into `style` props and spreads. Every edit is an insert or replace on a span. Code outside the edits is never copied or printed again.
- `process-css-template.ts`: turns each `${...}` into a CSS custom property, then runs the CSS steps below.
- `preprocess-css.ts`: one LightningCSS pass for nesting, colors and custom media, with the `browserslist` targets.
- `process-scoped-sheet.ts`: a css-tree pass that adds the `[s\:<scope>]` marker to each compound selector, unwraps `:global(...)`, hoists `@global` blocks and namespaces `@keyframes`.
- `ast.ts`, `constants.ts`, `errors.ts`: AST helpers, names of the runtime helpers and attributes, and `CompileError`.

A scoped sheet runs LightningCSS, then css-tree, then LightningCSS again. A global sheet runs LightningCSS once. LightningCSS alone cannot do the scoping step yet, so css-tree stays (see `spike-css-pipeline` in the roadmap).

## Runtime

`src/core.ts` holds everything the compiled code calls:

- `useSolidStyled` and `useSolidStyledGlobal`: insert a sheet when a component mounts and remove it on cleanup. On the client, sheets are reference counted by id, and sheets rendered by the server are picked up at load.
- `StyleRegistry`: on the server, collects each sheet once, into `styles` or, with `auto`, into the document head through `useHead`. Without a registry, the context default inserts sheets directly.
- `createCSSVars`, `mergeStyles`, `spreadStyle`: hold the CSS variables of a function and merge them into `style` props and spreads.
- `css`: a stub that throws when the compiler did not run.

`src/index.ts` adds the `jsx`, `global` and `use:solid-styled` attributes to Solid's JSX types.

## Tests

All tests are in `packages/solid-styled/test/` and run with `pnpm test`. `vitest.config.ts` splits them into projects:

- `unit`: compiler output tests per feature, mostly snapshots. The fast-check tests are here too:
  - `arbitraries.ts`: generators for CSS templates and components.
  - `properties.test.ts`: property tests of the CSS scoping.
  - `oracle.test.ts`: compares the output with the 0.12.1 compiler (`solid-styled-legacy`).
- `registry-client` and `registry-server`: `registry.model.test.ts`, a model-based test of the sheet registry, run once on each runtime path.
- `runtime-client`: `spread.runtime.test.ts`. It compiles `test/runtime/` fixtures with solid-styled and Solid's compiler, then renders them in happy-dom.

Set `FC_RUNS` and `FC_SEED` to run the property and oracle tests longer or replay a failure.

## Benchmarks

Run `pnpm build` first, then from `benchmarks/`:

- `pnpm bench`: times `compile` on each fixture in `fixtures/`, and the plugin on a file without styles.
- `pnpm bench:profile`: writes a CPU profile and reports time by stage.
- `pnpm bench:count`: counts the LightningCSS calls per fixture.

## Roadmap

Planned work and its status are in [`docs/roadmaps/1.0-hardening/`](./docs/roadmaps/1.0-hardening/).
