# Styling

## `css`

- Call `css` as a statement, not as an expression. The compiler only picks up `css\`...\`;` on its own line.
- Call it directly inside the component whose elements it styles.
- You can call it more than once in the same component. Each call becomes its own sheet under the same scope.

```jsx
import { css } from 'solid-styled';

function Card() {
  css`
    section {
      padding: 1rem;
    }
  `;

  css`
    h2 {
      font-weight: 700;
    }
  `;

  return (
    <section>
      <h2>Title</h2>
    </section>
  );
}
```

## `<style jsx>`

- `<style jsx>` is the same feature written inside JSX, and it compiles to the same output.
- The element itself is removed from the tree, so it renders nothing.
- It exists mostly to ease migration from `solid-styled-jsx`.

```jsx
function Card() {
  return (
    <>
      <style jsx>
        {`
          section {
            padding: 1rem;
          }
        `}
      </style>
      <section>Content</section>
    </>
  );
}
```

## Reactive values

- Every `${...}` in the template becomes a CSS custom property, and the sheet keeps the `var(...)` reference.
- The property is written on the component's own elements through the `style` prop, so it stays fine grained.
- The sheet is never regenerated when the value changes, which is why the sheet can be shared by every instance.

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

The output is roughly this.

```jsx
const sheet_1 = 'c-1a2b3c-0';
const css_1 = 'div[s\\:c-1a2b3c-0]{width:var(--s-v-1a2b3c-1)}';

function Bar(props) {
  const vars_1 = createCSSVars();
  (useSolidStyled(sheet_1, 1, css_1), vars_1(() => ({ '--s-v-1a2b3c-1': props.width })));

  return <div s:c-1a2b3c-0 style={vars_1()} />;
}
```

## What can be interpolated

- Interpolation works for CSS values, such as colors, lengths and gradients.
- It does not work for selectors, property names or at-rule preludes, because the sheet must stay static.
- If you need a value to change the shape of the sheet, use a class name or an attribute selector instead.

## Merging with an existing `style` prop

- If an element already has a `style` prop, the compiler merges the CSS variables into it with `mergeStyles`.
- Object styles, string styles and no style at all are all handled.

```jsx
<div style={{ color: 'red' }} />
// becomes
<div s:c-1a2b3c-0 style={mergeStyles({ color: 'red' }, vars_1())} />
```
