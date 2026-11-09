---
'solid-styled': patch
'unplugin-solid-styled': patch
---

An invalid `browserslist` option now throws its own error instead of a `CompileError` that points at a template. `solidStyled.vite()` and the other bundler entries no longer throw when called without options.
