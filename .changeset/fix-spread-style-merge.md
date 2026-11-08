---
'solid-styled': minor
---

Fix lost CSS variables on elements that spread props. With 0.12.1 the compiler put its `s:` marker and `style` after the spread, so the CSS variables replaced the `style` from the spread. Now the marker goes after the last spread, and the CSS variables merge into the `style` Solid resolves: the last source with a `style` key, with `null` and `undefined` spreads skipped. An explicit `style` merges the CSS variables in place, and each spread after it is wrapped in place by `spreadStyle`, a new runtime export that only compiled code needs to call. When the spread has a `style` key, `spreadStyle` merges the CSS variables into it through Solid's `merge`, so getters and reactivity survive. The spread is not copied or moved, so a call in it runs as often as it does without solid-styled, and the element stays in its parent template.
