# solid-styled

> Reactive stylesheets for SolidJS

[![NPM](https://img.shields.io/npm/v/solid-styled.svg)](https://www.npmjs.com/package/solid-styled) [![JavaScript Style Guide](https://badgen.net/badge/code%20style/airbnb/ff5a5f?icon=airbnb)](https://github.com/airbnb/javascript)[![Open in CodeSandbox](https://img.shields.io/badge/Open%20in-CodeSandbox-blue?style=flat-square&logo=codesandbox)](https://codesandbox.io/s/github/LXSMNSYC/solid-styled/tree/main/examples/demo)

## Install

```bash
npm i solid-styled babel-plugin-solid-styled
```

```bash
yarn add solid-styled babel-plugin-solid-styled
```

```bash
pnpm add solid-styled babel-plugin-solid-styled
```

## Features

- Render stylesheets only once
- Fine-grained reactive CSS properties
- Scoped stylesheets
- `:global` selector
- SSR

## Usage

### Babel

**Note: This is required for `solid-styled` to work its magic properly!**

```json
{
  "plugins": [
    "babel-plugin-solid-styled"
  ]
}
```

### `<StyleRegistry>`

`<StyleRegistry>` manages the lifecycle of stylesheets. It is required only to be used once, preferably at the root of your SolidJS application

```js
import { StyleRegistry } from 'solid-styled';

<StyleRegistry>
  <App />
</StyleRegistry>
```

For SSR, you can pass an array to the `styles` prop of `<StyleRegistry>`. This array collects all of the "critical" (initial render) stylesheets, that which you can render as a string with `renderSheets`.

```js
const styles = [];

renderToString(() => (
  <StyleRegistry styles={styles}>
    <App />
  </StyleRegistry>
));

// Render sheets
// You can use the resulting sheet by inserting
// it into an HTML template.
const styles = renderSheets(styles);
```

### `css`

Use the `css` tagged template for writing stylesheets.

```js
import { css } from 'solid-styled';

function Title() {
  css`
    h1 {
      color: red;
    }
  `;

  return <h1>Hello World</h1>;
}
```

The template is also reactive. It works by replacing all templating values with a CSS variable. This allows the stylesheet to be only rendered once and can be shared by multiple components of the same scope.

```js
import { css } from 'solid-styled';

function Button() {
  const [color, setColor] = createSignal('red');
  css`
    h1 {
      color: ${color()};
    }
  `;

  return (
    <button onClick={() => {
      setColor((c) => (c === 'red' ? 'blue' : 'red'));
    }}>
      Current color: {color()}
    </button>
  );
}
```

By default, all styles are scoped to its component and cannot leak into another component. The scoping only applies all DOM nodes that can be found in the component, including the children of the external components.

```js
import { css } from 'solid-styled';

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
  )
}
```

#### `:global`

Since all selectors in a given stylesheet are scoped by default, you can use the `:global` pseudo selector to opt-out of scoping:

```js
import { css } from 'solid-styled';

function Feed(props) {
  css`
    div > :global(* + *) {
      margin-top: 0.5rem;
    }
  `;

  return (
    <div>
      <For each={props.articles}>
        {(item) => (
          // This item is affected by the CSS of the Feed component.
          <FeedArticle data={item} />
        )}
      </For>
    </div>
  );
}
```

## License

MIT © [lxsmnsyc](https://github.com/lxsmnsyc)
