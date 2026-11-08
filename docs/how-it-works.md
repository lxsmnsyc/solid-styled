# How it works

## The pipeline

- The module is parsed with [oxc](https://oxc.rs), which is a native parser, so parsing costs almost nothing.
- A single walk collects the `css` templates, the `<style jsx>` elements, every JSX element and every `use:solid-styled` attribute.
- Each edit is applied as a span edit over [magic-string](https://github.com/Rich-Harris/magic-string), so code the compiler does not touch keeps its exact formatting.
- A scoped sheet goes through [LightningCSS](https://lightningcss.dev/) for lowering. A [css-tree](https://github.com/csstree/csstree) pass then applies the scoping, and LightningCSS runs again for minification. A `<style jsx global>` sheet goes through LightningCSS once.
- The result is the rewritten code plus a high resolution source map.

## What the output looks like

Given this input in `src/Example.jsx`:

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

const sheet_1 = 'c-76110b4f-0';
const css_1 = 'h1[s\\:c-76110b4f-0]{color:red}';
export default function Example() {
  _useSolidStyled(sheet_1, 1, css_1);

  return <h1 s:c-76110b4f-0>Hello World</h1>;
}
```

- The runtime helpers are imported through one import statement, with `_name` locals.
- `sheet_1` holds the scope id and is shared by every sheet of the component.
- `css_1` holds the compiled sheet as a plain string constant at module level.
- `_useSolidStyled` inserts the sheet when the component runs and releases it on cleanup.
- The scope id is derived from a hash of the file path without its query string. It is stable across builds and unique per module.

## Ids you may see

- `c-<hash>-<n>` is a scope id, and `<n>` counts the ids generated in the module.
- `--s-v-<hash>-<n>` is a CSS custom property standing in for one interpolated value.
- With `verbose`, the component name is inserted into the scope id, giving names such as `c-Example-<hash>-0`. CSS custom properties do not change.
- With `prefix: 'my-app'`, the leading `c-` and `v-` become `my-app-`, giving `my-app-<hash>-0` and `--s-my-app-<hash>-1`.
- `s:id` is the attribute on each inserted `<style>` element. It holds the scope id and the sheet number, such as `c-76110b4f-0-1`.

## How values reach elements

### Reactive values

```jsx
function Bar(props) {
  css`
    div {
      width: ${props.width}px;
    }
  `;

  return <div />;
}
```

The output is this, with the import line left out.

```jsx
const sheet_1 = 'c-67589289-0';
const css_1 = 'div[s\\:c-67589289-0]{width:calc(var(--s-v-67589289-1)*1px)}';
function Bar(props) {
  const vars_1 = _createCSSVars();
  (_useSolidStyled(sheet_1, 1, css_1), vars_1(() => ({ '--s-v-67589289-1': props.width })));

  return <div s:c-67589289-0 style={vars_1()} />;
}
```

- `vars_1` is declared at the top of the component body, which is why the component needs a block body.
- `vars_1(() => ({ ... }))` registers the values. `vars_1()` reads them as a style object.
- Each scoped element gets `style={vars_1()}`, so a change updates the custom property on that element only.
- A nested component that declares its own sheet gets both scope markers, and both sets of values are merged with `mergeStyles`.

### Merging with an existing `style` prop

- If an element already has a `style` prop, the compiler merges the CSS variables into it with `mergeStyles`.
- Object styles, string styles and no style at all are all handled.

```jsx
<div style={{ color: 'red' }} />
// becomes
<div s:c-1a2b3c-0 style={mergeStyles({ color: 'red' }, vars_1())} />
```

### Spread attributes

Solid gives an element the `style` of the last source that has a `style` key. A `null` or `undefined` spread is skipped. The compiler keeps that rule and adds the CSS variables to whichever `style` wins.

- The scope marker goes after the last spread, so a spread cannot replace it.
- An explicit `style` after the last spread merges the CSS variables in place, as above.
- Otherwise, the last explicit `style` merges them in place. With no explicit `style`, the compiler adds `style={vars_1()}` after the element name.
- Each spread after that `style` is wrapped by `spreadStyle`. When the spread has a `style` key, `spreadStyle` returns it through Solid's `merge` with that style merged with the CSS variables. Any other spread is returned as is. A function spread such as `{...signal}` is called first, as Solid does.
- The spread is wrapped where it is. It is not copied or moved, so a call such as `{...getProps()}` runs as often as with any other reactive attribute on the element, and the element stays in its parent template.
- A static sheet has no CSS variables. The compiler only adds the scope marker after the last spread.

```jsx
<button style={base} {...props} />
// becomes
<button
  style={mergeStyles(base, vars_1())}
  {...spreadStyle(props, vars_1)}
  s:c-1a2b3c-0
/>
```

`await` and `yield` cannot be used inside a spread on a scoped element. See [Known limits](./known-limits.md).

## Writing your own integration

See [`solid-styled/compiler`](./api.md#solid-styledcompiler) in the API reference to call the compiler directly.
