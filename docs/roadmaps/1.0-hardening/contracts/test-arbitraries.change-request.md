# Change request: test-arbitraries

From node `test-arbitraries`. The contract is not edited. The node uses this shape.

## Why

The contract says `component(opts?): Arbitrary<string>`. A string cannot say how many `css` templates must compile. Oracle and property tests need that number, because shadowed templates are left alone on purpose.

## New shape

- `component(opts?): Arbitrary<GeneratedModule>`, where `GeneratedModule` has `code: string` and the expected counts: `expectedCompiled`, `expectedUntouched`, `expectedCss`, `expectedStyle`, `expectedGlobal`. It also has `importForm`, `local` and `vars`.
- `cssTemplate()` is unchanged: `Arbitrary<{ source: string; vars: string[] }>`.
- `COMPILED_CALL` is a regex to count compiled templates in the output.

Callers that only want the source write `component().map((m) => m.code)`.
