---
'solid-styled': patch
---

Support CSS units written right after an interpolation, as in `width: ${size()}px`. The compiler used to output `var(--id) px`, which browsers drop. It now outputs `calc(var(--id) * 1px)`.
