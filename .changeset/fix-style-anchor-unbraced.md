---
'solid-styled': patch
---

Fix `<style jsx>` in a component whose `return` is the unbraced body of `if`, `else`, a loop or a label. The setup call became that body and the `return` ran every time. The call now goes before the outermost control statement, as in 0.12.1.
