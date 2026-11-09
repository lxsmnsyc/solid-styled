---
'solid-styled': patch
---

A CSS error in a template, such as `${}` inside an `@media` query, now throws a `CompileError` with the template's line and column. It threw a plain `SyntaxError` before.
