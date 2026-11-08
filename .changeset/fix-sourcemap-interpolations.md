---
'solid-styled': patch
---

The source map now covers the `${...}` expressions of `css` templates and `<style jsx>` elements. The compiler keeps those expressions in place, or moves them into the hoisted setup call, instead of copying their text, so they map back to where they were written. The map also embeds the source (`sourcesContent`) and names the file without its query string.
