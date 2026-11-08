---
'solid-styled': patch
---

Fix type-only imports of `css` being compiled. `import type { css }`, `import { type css }` and `import type * as s` no longer count as the runtime `css` import, so their templates are left as written. This matches 0.12.1.
