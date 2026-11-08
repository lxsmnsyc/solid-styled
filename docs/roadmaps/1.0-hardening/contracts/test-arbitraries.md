---
name: test-arbitraries
status: draft
version: 0
defined_by: test-arbitraries
---

# test-arbitraries

Shared fast-check generators for compiler tests, in `packages/solid-styled/test/arbitraries.ts`.

- `cssTemplate(): Arbitrary<{ source: string; vars: string[] }>`: a `css` template body built from valid selectors (type, class, id, attribute, nested, `:global(...)`), declarations, `@keyframes`, `@media`, and `${expr}` interpolations in property values, including ones followed by units (`${x}px`).
- `component(opts?): Arbitrary<string>`: a module that imports `css` (optionally aliased or namespaced), declares one or more components that call `css` and return JSX, with optional local shadowing of `css` (`let`, `var` in a nested block, function parameter, class name, switch case, catch parameter).
- `compileBoth(code)` is not part of this contract; oracle code stays in its own node.

Frozen when `test-arbitraries` merges. Changes go through a change request.
