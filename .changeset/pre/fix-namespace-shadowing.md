---
'solid-styled': patch
---

A constructor parameter property such as `constructor(private css: any)` now shadows the `css` import. The template in that class is left as is. Code outside the class still compiles.
