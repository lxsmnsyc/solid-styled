---
'solid-styled': patch
---

`CompileError` now reports a 1-based column, like its line, so `(line:column)` in the message matches the position editors show. Code that reads `error.column` gets a value one higher than before. Fixes #49.
