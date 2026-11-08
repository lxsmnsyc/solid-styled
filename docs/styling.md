# Styling

## `css`

- Call `css` as a statement, not as an expression. The compiler only picks up ``css`...`;`` on its own line.
- Call it directly inside the component whose elements it styles.
- You can call it more than once in the same component. Each call becomes its own sheet under the same scope.
- A `css` call outside any function is not compiled, so it throws at runtime.
- A `css` call in another function, such as a hook, compiles, but its scoped selectors match nothing. Use it there only for global rules, through `:global` or `@global`.

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

See [Editor and linting](./editor.md#linting) if your linter reports the bare `css` statement.

## `<style jsx>`

- `<style jsx>` is the same feature written inside JSX, and it compiles to the same output.
- The element itself is removed from the tree, so it renders nothing.
- It exists mostly to ease migration from `solid-styled-jsx`.
- Write it as a child of an element or fragment, inside a component with a block body. See [Known limits](./known-limits.md) for what fails otherwise.

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

### `<style jsx global>`

- Add `global` to emit the sheet without scoping.
- Interpolated values are set on the document root (`:root`), so every element can read them.

```jsx
function Theme(props) {
  return (
    <>
      <style jsx global>
        {`
          body {
            color: ${props.color};
          }
        `}
      </style>
      {props.children}
    </>
  );
}
```

## Reactive values

- Every `${...}` in the template becomes a CSS custom property, and the sheet keeps the `var(...)` reference.
- The property is written on the component's own elements through the `style` prop, so it stays fine grained.
- The sheet is never regenerated when the value changes, which is why the sheet can be shared by every instance.
- A CSS unit written right after an interpolation, as in `${size()}px`, is applied with `calc()`. `width: ${size()}px` becomes `width: calc(var(--s-v-...) * 1px)`.
- A component that declares reactive values needs a block body, because the compiler declares a variable holder at the top of it. An arrow function with an expression body throws a `CompileError`.

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

- An element that already has a `style` prop, or spreads props, keeps its styles. The compiler merges the CSS variables into them.
- See [How values reach elements](./how-it-works.md#how-values-reach-elements) for the compiled output.

## What can be interpolated

- Interpolation works for CSS values, such as colors, lengths and gradients.
- It does not work for selectors, property names or at-rule preludes, because the sheet must stay static.
- If you need a value to change the shape of the sheet, use a class name or an attribute selector instead.

```jsx
function Alert(props) {
  css`
    div[data-kind='error'] {
      color: red;
    }
  `;

  return <div data-kind={props.kind}>{props.children}</div>;
}
```
