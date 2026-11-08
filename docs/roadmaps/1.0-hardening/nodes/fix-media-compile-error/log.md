# Log

- Added the test in `test/output.test.ts` before the fix.
- On origin/1.0 it failed: `expected SyntaxError: Invalid media query to be an instance of CompileError`.
- Wrapped the LightningCSS call in `preprocessCSS`. The error points at the template start (the backtick), since LightningCSS positions refer to the rewritten sheet, not the source.
- css-tree errors: `processScopedSheet` is not wrapped. It parses LightningCSS output, which is valid CSS.
