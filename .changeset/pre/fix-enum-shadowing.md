---
'solid-styled': patch
---

A local `enum css` or `const enum css` inside a function now shadows the `css` import. The template in that scope is left as is, like with `let css`. `type css` and `interface css` still do not shadow it.
