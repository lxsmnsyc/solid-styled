---
'solid-styled': major
'unplugin-solid-styled': major
---

Remove the `env` compiler option. The 1.0 compiler never read it, so passing it had no effect. The Vite entry of `unplugin-solid-styled` no longer sets it.
