---
'solid-styled': minor
---

Add CSP nonce support. `StyleRegistry` takes a `nonce` prop, and `renderSheets` takes the nonce as a second argument, to put `nonce="..."` on each `<style>` element. On the client, sheets inserted after hydration reuse the nonce of the server rendered sheets when the registry gives none.
