---
'solid-styled': patch
---

A local `css` binding inside a TypeScript `namespace` now shadows the `css` import. This covers `const`, `let`, `var`, `function`, `class`, `enum` and `import css = M.x`, and a local that shadows `import * as s`. A constructor parameter property such as `constructor(private css: any)` now shadows it too. The template in those scopes is left as is. Code outside the namespace or class still compiles. Namespace shadowing worked in 0.12.1 and was lost in 1.0. Parameter properties were never handled.
