---
'solid-styled': patch
---

Fix invalid output for exported components that use `<style jsx>` in an arrow function with an expression body. The compiler put the setup call between `export` and the declaration. It now goes before the whole `export` statement, as in 0.12.1. The same fix applies to `export class` and `export default class` with arrow class fields.
