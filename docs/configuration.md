# Configuration

## Plugin order

- `solid-styled` must run before the SolidJS JSX transform, because it rewrites JSX attributes.
- The Vite entry sets `enforce: 'pre'` and moves itself ahead of the `solid`, `astro:jsx` and `solid-start-file-system-router` plugins for you.
- With every other bundler, put `solid-styled` first in the `plugins` array yourself.

## Options

Every bundler entry takes the same options. All of them are optional, and `solidStyled.vite()` with no argument uses the defaults.

| Option           | Type            | Default                                       | What it does                                                                                                                                 |
| ---------------- | --------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `verbose`        | `boolean`       | `false`                                       | Puts the component name into the scope id, which makes the DOM easier to read while debugging.                                               |
| `prefix`         | `string`        | `undefined`                                   | Replaces the default `c-` and `v-` prefixes of generated names. Use it when you publish a styled component library, so scopes never collide. |
| `browserslist`   | `string`        | `'defaults'`                                  | The browser targets LightningCSS lowers the sheet for.                                                                                       |
| `filter.include` | `FilterPattern` | `'src/**/*.{jsx,tsx,ts,js,mjs,cjs}'`          | Files the plugin compiles.                                                                                                                   |
| `filter.exclude` | `FilterPattern` | `'node_modules/**/*.{jsx,tsx,ts,js,mjs,cjs}'` | Files the plugin skips.                                                                                                                      |

```js
solidStyled.vite({
  verbose: true,
  prefix: 'my-app',
  browserslist: 'last 2 versions',
  filter: {
    include: 'src/**/*.tsx',
    exclude: 'node_modules/**/*',
  },
});
```

### `verbose` and `prefix`

- `verbose` uses the name of the nearest named function, variable or method. Without one, the name is `Anonymous`.
- `prefix: 'my-app'` turns `c-<hash>-0` into `my-app-<hash>-0` and `--s-v-<hash>-1` into `--s-my-app-<hash>-1`.
- See [Ids you may see](./how-it-works.md#ids-you-may-see) for the full id format.

### `browserslist`

- The value is a [browserslist](https://github.com/browserslist/browserslist) query.
- CSS nesting, modern color syntax and custom media queries are always lowered. The targets decide how the rest of the sheet is written.
- An invalid query throws the browserslist error, not a `CompileError`.

### `filter.include` and `filter.exclude`

- Both take a `FilterPattern` from `@rollup/pluginutils`: a glob string, a `RegExp`, an array of them, or `null`. `null` keeps the default.
- Patterns are matched against the absolute file path. A query string such as `?v=123` is removed first.
- A pattern that does not start with `**` and is not absolute is resolved against the current working directory.
- `exclude` is checked first. A file that matches `exclude` is skipped, even when it also matches `include`.
- Each option replaces its default. Setting only `include` keeps the default `exclude`, which skips everything in `node_modules`.
- To compile a library inside `node_modules`, see [Component libraries](./component-libraries.md#option-1-the-app-compiles-the-library).
