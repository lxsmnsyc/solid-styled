# Change request: test-arbitraries

From node `test-arbitraries`. The contract is not edited. The node uses this shape.

## Why

The contract says `component(opts?): Arbitrary<string>`. A string cannot say which `css` templates must compile. Oracle and property tests need that, because shadowed templates are left alone on purpose. A count alone is too weak: two wrong templates can cancel out, so each template carries a marker and its own expected result.

## New shape

- `cssTemplate(opts?: { global?: boolean; keyframes?: boolean; media?: boolean }): Arbitrary<{ source: string; vars: string[]; sample: string }>`.
  - The options default to `true`. `global: false` drops `@global { }` and `:global(...)`. The property tests over sheet processing use them to leave out what they cannot model.
  - `sample` is `source` with each interpolation (and its unit) replaced by a valid value of its kind.
- `component(opts?): Arbitrary<GeneratedModule>`, where `GeneratedModule` is `{ code: string; importForm: ImportForm; templates: GeneratedTemplate[] }`.
  - `GeneratedTemplate` is `{ marker: string; kind: 'css' | 'style' | 'global'; compiled: boolean; vars: string[] }`, one per template, in source order.
  - `marker` is a `/*t<N>*/` comment at the start of the template body, unique in the module. It stays in the output right after a backtick exactly when `compiled` is false.
- `countCompiled(code: string): number` parses the output with oxc-parser and counts calls whose callee name matches `^_?useSolidStyled(Global)?(_\d+)?$`. It works on the new compiler and on 0.12.1. It replaces the `COMPILED_CALL` regex.
- `invalidComponent(): Arbitrary<{ code: string; reason: InvalidReason }>` gives modules that must throw `CompileError`.

Callers that only want the source write `component().map((m) => m.code)`.
