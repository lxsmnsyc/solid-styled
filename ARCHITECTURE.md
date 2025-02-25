# Architecture

An overview of how `solid-styled` works. The architecture is divided into two parts: the compiler and the runtime.

## The Compiler

`solid-styled`'s compiler is a combination of JS and CSS compilers. `solid-styled` uses [Babel](https://github.com/babel/babel) for transforming JS files while it uses [CSSTree](https://github.com/csstree/csstree) for generating and transforming CSS. [LightningCSS](https://lightningcss.dev/) is also used for browserlist compilation. 

- When compiling JS, the compiler [generates a unique hash](https://github.com/lxsmnsyc/solid-styled/blob/1398e29edb9abfb2e12be4e7b25ea5d17125c357/packages/solid-styled/compiler/index.ts#L24) as an identifier to the file (so that it stays the same for hot reload).
- The compiler will then attempt to find the following concurrently:
  - [`<style>` tags with `jsx` attribute](https://github.com/lxsmnsyc/solid-styled/blob/1398e29edb9abfb2e12be4e7b25ea5d17125c357/packages/solid-styled/compiler/plugin.ts#L306)
  - [`css` tags](https://github.com/lxsmnsyc/solid-styled/blob/1398e29edb9abfb2e12be4e7b25ea5d17125c357/packages/solid-styled/compiler/plugin.ts#L359) (specifically referring from the `import { css } from 'solid-styled'`)
- When either of the targets are encountered, the template strings are extracted.
  - If the template has dynamic parts, [it will be filled in with `var(--[file-hash]-[expr-count])`](https://github.com/lxsmnsyc/solid-styled/blob/1398e29edb9abfb2e12be4e7b25ea5d17125c357/packages/solid-styled/compiler/core/process-css-template.ts#L12). These dynamic parts are also collected for later use.
- The owning function will receive a unique identifier that is going to be used for scoping styles.
- If the CSS template was from a `css` tag or `<style jsx>`:
  - The template string is first compiled through LightningCSS for pre-compilation. [This resolves color values, css nesting and custom media queries](https://github.com/lxsmnsyc/solid-styled/blob/1398e29edb9abfb2e12be4e7b25ea5d17125c357/packages/solid-styled/compiler/core/preprocess-css.ts#L5);
  - The processed template is then processed for transforming `solid-styled` features like [scoping selector](https://github.com/lxsmnsyc/solid-styled/blob/1398e29edb9abfb2e12be4e7b25ea5d17125c357/packages/solid-styled/compiler/core/process-scoped-sheet.old.ts#L14) and the `:global` and `@global` features.
- If the CSS template was from `<style jsx global>`
  - The template is only compiled through LightningCSS.
- Once the template transformation is done, a new module-level variable is created for the JS file where it will contain the template.
- If there are any dynamic parts collected, a `createCSSVars` variable is called to the owning function. This function is used for collecting all dynamic variables. It also acts as a signal that generates a `style` object that patches the CSS variables related to it.
- In place of the `css` tag and the `<style jsx>`, a `useSolidStyled` call is placed. This receives the unique identifier for the owning function and the generated template.
- Once all templates are done transforming, JSX in the entire file is crawled next.
- If a JSX-owning function has processed templates, [the owned JSX is transformed](https://github.com/lxsmnsyc/solid-styled/blob/1398e29edb9abfb2e12be4e7b25ea5d17125c357/packages/solid-styled/compiler/plugin.ts#L133).
  - For lower-case JSX (aka host elements) and JSX with `use:solid-styled`, a `style` attribute is inserted whose value derives from the `createCSSVars` signal.
    - If there's a `style` attribute already in place, the existing style and new style are merged.
    - The JSX also receives a scoping attribute which is used for CSS scoping.

## The Runtime
