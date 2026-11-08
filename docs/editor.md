# Editor

## Syntax highlighting

- The `css` template is plain CSS, so any editor plugin that highlights `css` tagged templates works.
- In VS Code, the [vscode-styled-components](https://marketplace.visualstudio.com/items?itemName=styled-components.vscode-styled-components) extension highlights `` css`...` `` templates. It also offers CSS completions inside them.
- The template inside `<style jsx>` is an untagged template literal. Editor plugins that look for a `css` tag do not treat it as CSS. Use `css` if you want highlighting.
- Scope markers such as `s:c-1a2b3c-0` only exist in the compiled output, so you never write them by hand.

## CSS comments in VS Code

- Inside `<style jsx>`, the VS Code comment command writes a JSX comment (`{/* ... */}`), which is not valid CSS.
- The keybindings below toggle CSS comments (`/* ... */`) instead.
- `ctrl+shift+/` toggles a comment on the current line. No selection is needed.
- `ctrl+shift+oem_7` toggles a comment around the selected lines. `oem_7` is the `'` key on a US keyboard.
- Change the keys as needed. Put the entries in your `keybindings.json` (command palette, `Preferences: Open Keyboard Shortcuts (JSON)`).

```jsonc
[
  {
    // Toggle a comment on the current line. No selection needed.
    "key": "ctrl+shift+/",
    "command": "runCommands",
    "args": {
      "commands": [
        "cursorEnd", // so the cursor stays on the same line
        "cursorHomeSelect",
        {
          "command": "editor.action.insertSnippet",
          "args": {
            "snippet": "${TM_SELECTED_TEXT/(\\/\\* )(.+)( \\*\\/)|(.*)/$2${4:+/* }$4${4:+ */}/}",
          },
        },
      ],
    },
    "when": "resourceExtname =~ /\\.(js|ts|r)(?!on)/",
  },
  {
    // Toggle a comment around a selected block.
    "key": "ctrl+shift+oem_7",
    "command": "editor.action.insertSnippet",
    "args": {
      "snippet": "${TM_SELECTED_TEXT/(\\/\\*)([\\s\\S]*?)(\\*\\/)|([\\s\\S]+)/$2${4:+/* }$4${4:+ */}/}",
    },
    "when": "resourceExtname =~ /\\.(js|ts|r)(?!on)/",
  },
]
```

- The `when` clause matches `.js`, `.jsx`, `.ts` and `.tsx` files, and skips `.json`. Edit it to match your file types.
- These keybindings were shared by [@AverTry](https://github.com/AverTry) in [#40](https://github.com/lxsmnsyc/solid-styled/issues/40).
