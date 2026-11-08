# Scoping

## How scoping works

- Each component that declares a sheet gets a scope id, such as `c-1a2b3c-0`.
- Every host element written inside that component receives a scope marker, an attribute such as `s:c-1a2b3c-0`.
- Every compound selector in the sheet gets the scope marker appended, so `h1` becomes `h1[s\:c-1a2b3c-0]` and `nav a` becomes `nav[s\:c-1a2b3c-0] a[s\:c-1a2b3c-0]`.
- Elements rendered by another component never get the scope marker, so the styles cannot reach them.

## What counts as inside

- Host elements written in the component's JSX are scoped, including elements written inside a nested arrow function.
- Elements passed as children to another component are scoped, because you wrote them.
- Elements a child component renders on its own are not scoped.

```jsx
function ForeignTitle() {
  return <h1>This is not affected</h1>;
}

function Title() {
  css`
    h1 {
      color: red;
    }
  `;

  return (
    <>
      <h1>This is affected.</h1>
      <ForeignTitle />
      <Container>
        <h1>This is also affected.</h1>
      </Container>
    </>
  );
}
```

- Both `h1` elements written in `Title` get `s:c-1a2b3c-0`. The `h1` that `ForeignTitle` renders does not.

## CSS nesting

- Nested rules are lowered by LightningCSS before scoping, so the scoping rules above apply to the flat selectors.
- Every compound selector of the flat selector is scoped, including the parent that `&` stands for.

```jsx
css`
  .card {
    color: red;

    & h2 {
      color: blue;
    }

    &:hover {
      color: green;
    }

    .dark & {
      color: white;
    }

    @media (min-width: 600px) {
      padding: 1rem;
    }
  }
`;
```

This compiles to these rules, shown with whitespace added.

```css
.card[s\:c-1a2b3c-0] {
  color: red;
}
.card[s\:c-1a2b3c-0] h2[s\:c-1a2b3c-0] {
  color: #00f;
}
.card[s\:c-1a2b3c-0]:hover {
  color: green;
}
.dark[s\:c-1a2b3c-0] .card[s\:c-1a2b3c-0] {
  color: #fff;
}
@media (width >= 600px) {
  .card[s\:c-1a2b3c-0] {
    padding: 1rem;
  }
}
```

- A nested rule without `&`, such as `h2 { ... }` inside `.card`, is treated as `& h2`.
- `.dark &` only matches when the `.dark` element is also written in this component. Use `:global(.dark) &` for an ancestor outside it.

## `:global`

Use `:global(...)` to opt a single selector out of scoping.

```jsx
css`
  div > :global(* + *) {
    margin-top: 0.5rem;
  }
`;
```

- The compiler unwraps `:global(...)` and leaves what is inside untouched.
- The rest of the selector is still scoped, so `div` above still carries the marker.
- In a selector list, such as `.a, :global(.b)`, the global part can still be scoped. Put `:global(...)` in its own rule. See [Known limits](./known-limits.md).

## `@global`

Use `@global` when several rules should be global.

```jsx
css`
  @global {
    body {
      background-color: black;
    }

    main {
      padding: 0.5rem;
    }
  }

  h1 {
    color: white;
  }
`;
```

- The block is hoisted out and its rules are emitted as written.
- Keyframes declared inside `@global` keep their name, while keyframes outside it are prefixed with the scope.
- Inside `@global`, a selector joined to `&` with no space, such as `&:hover` or `&.active`, loses the `&`. See [Known limits](./known-limits.md).

## Keyframes

- `@keyframes fade` inside a scoped sheet is renamed to `c-1a2b3c-0-fade`.
- References through `animation` and `animation-name` are renamed to match.
- Names that do not belong to the sheet are left alone, so you can still use animations declared elsewhere.

## `use:solid-styled`

Scoping applies to DOM elements, not to components, so a component such as `<Dynamic>` is not scoped by default. Add `use:solid-styled` to forward the current scope to it.

```jsx
css`
  * {
    color: red;
  }
`;

<Dynamic component={props.as} use:solid-styled>
  {props.children}
</Dynamic>;
```

This compiles to the marker being passed as a prop.

```jsx
<Dynamic s:c-1a2b3c-0 component={props.as}>
  {props.children}
</Dynamic>
```

- When the sheet has interpolated values, the compiler also passes `style={vars_1()}`, as it does for host elements.
- The component has to spread its props onto a DOM element for the marker to land somewhere.
- The `use:solid-styled` attribute itself is always removed from the output.

## Nested components

- A component declared inside another component sees both scopes.
- Its elements carry both scope markers, and both sets of CSS variables are merged into the `style` prop with `mergeStyles`.
