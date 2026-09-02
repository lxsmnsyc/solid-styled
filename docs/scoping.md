# Scoping

## How scoping works

- Each component that declares a sheet gets a scope id, such as `c-1a2b3c-0`.
- Every host element written inside that component receives a matching attribute, such as `s:c-1a2b3c-0`.
- Every selector in the sheet gets that attribute appended, so `h1` becomes `h1[s\:c-1a2b3c-0]`.
- Elements rendered by another component never get the attribute, so the styles cannot reach them.

## What counts as inside

- Host elements written in the component's JSX are scoped, including elements written inside a nested arrow function.
- Elements passed as children to another component are scoped, because you wrote them.
- Elements a child component renders on its own are not scoped.

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
<Dynamic component={props.as} s:c-1a2b3c-0 style={vars_1()}>
  {props.children}
</Dynamic>
```

- The component has to spread its props onto a DOM element for the marker to land somewhere.
- The `use:solid-styled` attribute itself is always removed from the output.

## Nested components

- A component declared inside another component sees both scopes.
- Its elements carry both markers, and both sets of CSS variables are merged into the `style` prop.
