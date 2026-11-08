---
'solid-styled': patch
---

A local binding named `css` now stops the compiler from treating `css` templates as `solid-styled` templates in more places. The compiler now sees a `var` declared in a nested block or loop, a `let` or `const` declared in a `switch` case, and the name of a class expression. Before, it compiled these templates anyway. Fixes #50.
