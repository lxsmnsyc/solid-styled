---
'solid-styled': minor
---

Add a `root` prop to `StyleRegistry`. On the client, sheets are inserted into `root` instead of `document.head`, so a tree rendered into a shadow root gets its styles. Each root counts its sheets on its own.
