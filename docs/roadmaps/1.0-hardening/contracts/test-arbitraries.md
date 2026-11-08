---
name: test-arbitraries
status: frozen
version: 1
defined_by: test-arbitraries
---

# test-arbitraries

Shared fast-check generators for compiler tests, in `packages/solid-styled/test/arbitraries.ts`. Frozen at version 1 when #60 merged, with the shape from its change request. Details and gotchas: `nodes/test-arbitraries/outcome.md`.

## Shape

- `cssTemplate(opts?: { global?: boolean; keyframes?: boolean; media?: boolean }): Arbitrary<{ source: string; vars: string[]; sample: string }>`.
  - The options default to `true`. `global: false` drops `@global { }` and `:global(...)`. The property tests over sheet processing use them to leave out what they cannot model.
  - `sample` is `source` with each interpolation (and its unit) replaced by a valid value of its kind.
- `component(opts?): Arbitrary<GeneratedModule>`, where `GeneratedModule` is `{ code: string; importForm: ImportForm; templates: GeneratedTemplate[] }`.
  - `GeneratedTemplate` is `{ marker: string; kind: 'css' | 'style' | 'global'; compiled: boolean; vars: string[] }`, one per template, in source order.
  - `marker` is a `/*t<N>*/` comment at the start of the template body, unique in the module. It stays in the output right after a backtick exactly when `compiled` is false.
- `countCompiled(code: string): number` parses the output with oxc-parser and counts calls whose callee name matches `^_?useSolidStyled(Global)?(_\d+)?$`. It works on the new compiler and on 0.12.1. It replaces the `COMPILED_CALL` regex.
- `invalidComponent(): Arbitrary<{ code: string; reason: InvalidReason }>` gives modules that must throw `CompileError`.

Callers that only want the source write `component().map((m) => m.code)`.

## Notes

- `DEFAULT_IMPORT_FORMS` includes the type import forms since #65.
- For modules compiled by 0.12.1 (Babel), pass `modulePoison: false`: Babel rejects a module-level `var` that redeclares the import.
