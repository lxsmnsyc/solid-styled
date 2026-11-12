# SSR

## Collecting sheets

Wrap the tree in `<StyleRegistry>` and pass an array. Every sheet used during the render is pushed into it.

```jsx
import { renderToString } from '@solidjs/web';
import { StyleRegistry, renderSheets } from 'solid-styled';

const styles = [];

const html = renderToString(() => (
  <StyleRegistry styles={styles}>
    <App />
  </StyleRegistry>
));

const head = renderSheets(styles);
```

- `renderSheets` returns a string of `<style>` elements, ready to be inserted into your HTML template.
- Each element carries an `s:id` attribute, which the client uses to recognise sheets that are already present.

## Automatic insertion

If you render the whole document, use the `auto` prop instead and let Solid place the sheets in the head.

```jsx
renderToString(() => (
  <StyleRegistry auto>
    <App />
  </StyleRegistry>
));
```

## Hydration

- On the client, sheets that were server rendered are detected by their `s:id` and are not inserted twice.
- Sheets are reference counted, so a sheet is removed only when the last component using it unmounts.

## Without a registry

- `<StyleRegistry>` is optional on the client. Without it, sheets are inserted straight into `document.head`.
- On the server, a render without a registry produces no sheets at all, so add one whenever you server render.

## Content Security Policy

A `style-src` directive without `'unsafe-inline'` blocks `<style>` elements that do not carry its nonce. Create a random nonce for each response, send it in the header, and give it to solid-styled.

```
Content-Security-Policy: style-src 'self' 'nonce-r4nd0m'
```

- `renderSheets(styles, nonce)` puts `nonce="..."` on every element.
- With `auto`, pass the nonce to `<StyleRegistry nonce={nonce}>`, or to `renderToString(..., { nonce })`. The registry prop wins when both are set.
- On the client, sheets inserted after hydration reuse the nonce of the server rendered sheets. Pass `nonce` to the client `<StyleRegistry>` when there are no server rendered sheets to read it from.

CSS variables bound to an element are written to its `style` attribute. A nonce never covers `style` attributes, so the server rendered HTML still needs `style-src-attr 'unsafe-inline'` when a component uses them.
