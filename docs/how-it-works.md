# How it works

## The pipeline

- The module is parsed with [oxc](https://oxc.rs), which is a native parser, so parsing costs almost nothing.
- A single walk collects the `css` templates, the `<style jsx>` elements, every JSX element and every `use:solid-styled` attribute.
- Each edit is applied as a span edit over [magic-string](https://github.com/Rich-Harris/magic-string), so code the compiler does not touch keeps its exact formatting.
- The sheet itself goes through [LightningCSS](https://lightningcss.dev/) for lowering, then through a [css-tree](https://github.com/csstree/csstree) pass that applies the scoping, then through LightningCSS again for minification.
- The result is the rewritten code plus a high resolution source map.

## What the output looks like

Given this input:

```jsx
import { css } from 'solid-styled';

export default function Example() {
  css`
    h1 {
      color: red;
    }
  `;

  return <h1>Hello World</h1>;
}
```

The compiler emits this:

```jsx
import { useSolidStyled as _useSolidStyled } from 'solid-styled';

import { css } from 'solid-styled';

const sheet_1 = 'c-f0b3b6fa-0';
const css_1 = 'h1[s\\:c-f0b3b6fa-0]{color:red}';
export default function Example() {
  _useSolidStyled(sheet_1, 1, css_1);

  return <h1 s:c-f0b3b6fa-0>Hello World</h1>;
}
```

- `sheet_1` holds the scope id and is shared by every sheet of the component.
- `css_1` holds the compiled sheet as a plain string constant, so bundlers can hoist and dedupe it.
- `_useSolidStyled` inserts the sheet on mount and releases it on cleanup.
- The scope id is derived from a hash of the file path, so it is stable across builds and unique per module.

## Ids you may see

- `c-<hash>-<n>` is a scope id, and `<n>` counts the ids generated in the module.
- `--s-v-<hash>-<n>` is a CSS custom property standing in for one interpolated value.
- With `verbose`, the component name is inserted, giving names such as `c-Example-<hash>-0`.
- With `prefix`, the leading `c-` and `v-` are replaced by your own prefix.

## Compiler API

You can call the compiler directly if you are writing your own integration.

```ts
import { compile } from 'solid-styled/compiler';

const { code, map } = compile('src/App.tsx', source, {
  verbose: false,
  prefix: 'my-app',
  browserslist: 'defaults',
});
```

- `compile` is synchronous and takes the module id, the source, and the options.
- It throws a `CompileError` carrying the line and column when the module cannot be parsed or transformed.
