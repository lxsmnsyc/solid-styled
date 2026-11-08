---
'solid-styled': minor
---

Fix lost CSS variables on elements that spread props. The compiler put its `s:` marker and `style` before the spread, so a `style` in the spread replaced the CSS variables. They now go after the last spread, and the `style` from the spread is merged with the CSS variables through `mergeStyles`. A spread call such as `{...getProps()}` is wrapped in a memo, so it still runs once per change. That memo comes from a new runtime export, `trackSpread`, which only compiled code needs to call. A `null` or `undefined` spread is skipped, as in Solid. With 0.12.1 the CSS variables replaced the spread `style` instead.
