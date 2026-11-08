# API reference

## `solid-styled`

### Exports you call

#### `css`

```ts
const css: (template: TemplateStringsArray, ...spans: (string | boolean)[]) => void;
```

- A tagged template the compiler replaces. See [Styling](./styling.md#css).
- Calling it at runtime throws ``Unexpected use of `css`. Make sure that solid-styled's plugin is setup correctly.``
- The `spans` type only accepts strings and booleans. See [Known limits](./known-limits.md).

#### `StyleRegistry`

```ts
function StyleRegistry(props: StyleRegistryProps): JSX.Element;

interface StyleRegistryProps {
  auto?: boolean;
  styles?: StyleData[];
  children?: JSX.Element;
}

interface StyleData {
  id: string;
  sheet: string;
}
```

- `styles` collects every sheet used during a server render. Each sheet is pushed once per registry.
- `auto` inserts the collected sheets into the head through `useHead`.
- On the client, `auto` and `styles` have no effect. Sheets go into `document.head`.
- The registry is optional on the client. See [SSR](./ssr.md).

#### `renderSheets`

```ts
function renderSheets(sheets: StyleData[]): string;
```

- Returns one `<style s:id="...">` element per entry, as a single string.

### Compiler output helpers

The compiled code imports these. You normally do not call them.

#### `useSolidStyled`

```ts
function useSolidStyled(id: string, offset: string, sheet: string): void;
```

- Inserts the sheet under the id `${id}-${offset}` and removes it on cleanup. On the server it only records the sheet in the registry.

#### `useSolidStyledGlobal`

```ts
function useSolidStyledGlobal(
  id: string,
  offset: string,
  sheet: string,
  vars?: () => Record<string, string>,
): void;
```

- Used by `<style jsx global>`. Inserts the sheet and sets the values from `vars` on the document root.

#### `createCSSVars`

```ts
function createCSSVars(): (vars?: () => Record<string, string>) => JSX.CSSProperties | undefined;
```

- Returns a holder. Calling it with a function registers values. Calling it with no argument returns the merged values as a style object.

#### `mergeStyles`

```ts
function mergeStyles(
  source: JSX.CSSProperties | string | null | undefined,
  other: JSX.CSSProperties,
): string;
```

- Serializes both styles and joins them into one style string. `other` comes last.

#### `spreadStyle`

```ts
function spreadStyle(
  input: unknown,
  // Holders returned by `createCSSVars`.
  ...varsList: ((vars?: () => Record<string, string>) => JSX.CSSProperties | undefined)[]
): unknown;
```

- Wraps a spread on an element with CSS variables. A source with a `style` key gets that style merged with the variables, through Solid's `merge`. Any other source is returned as is.
- See [Spread attributes](./how-it-works.md#spread-attributes).

### Types

- `StyleRegistryProps` and `StyleData`, shown above.
- `CSSConstructor`, the type of `css`.
- `SolidStyledVariables`, an alias of `Record<string, string>`.
- The package types add `jsx` and `global` to `<style>`, and `use:solid-styled` to `JSX.IntrinsicAttributes`, in the `@solidjs/web` `JSX` namespace. See [TypeScript](./getting-started.md#typescript).

## `solid-styled/compiler`

### `compile`

```ts
function compile(id: string, code: string, options?: SolidStyledOptions): CompileOutput;

interface SolidStyledOptions {
  verbose?: boolean;
  prefix?: string;
  browserslist?: string;
}

interface CompileOutput {
  code: string;
  map: SourceMap;
}
```

```ts
import { compile } from 'solid-styled/compiler';

const { code, map } = compile('src/App.tsx', source, {
  prefix: 'my-app',
});
```

- `compile` is synchronous.
- `id` is the module path. Its query string is ignored for the scope hash.
- Files ending in `.ts`, `.tsx`, `.mts` or `.cts` are parsed as TSX. Every other file is parsed as JSX.
- `map` is a magic-string source map with `hires: true`.
- The options are the plugin options without `filter`. See [Configuration](./configuration.md#options).

### `CompileError`

```ts
class CompileError extends Error {
  // `name` is 'CompileError'.
  line: number;
  column: number;
}
```

- `line` and `column` are 1-based, and the message ends with `(line:column)`.
- `compile` throws it for a parse error, a CSS error in a template, or an invalid `style` value.
- It also throws it for an arrow function with an expression body that needs CSS variables.
- An invalid `browserslist` option throws the browserslist error instead.

## `unplugin-solid-styled`

```ts
import solidStyled from 'unplugin-solid-styled';

solidStyled.vite(options);
```

- The default export is an [unplugin](https://github.com/unjs/unplugin) instance.
- Entries: `vite`, `rollup`, `rolldown`, `webpack`, `rspack`, `rsbuild`, `esbuild`, `farm`, `bun` and `unloader`. `raw` returns the plain plugin object.
- `options` is `SolidStyledOptions` plus `filter: { include?, exclude? }`. Both filter fields take a `FilterPattern` from `@rollup/pluginutils`. See [Configuration](./configuration.md#options).
- The types `SolidStyledPluginOptions` and `SolidStyledPluginFilter` are exported.
- Only the Vite entry reorders itself before the Solid plugin. See [Plugin order](./configuration.md#plugin-order).
