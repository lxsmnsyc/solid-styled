/**
 * Code themes built from the site palette. Every foreground clears WCAG AA
 * (4.5:1) against the code background of its theme (`--code-bg` in
 * `src/components/GlobalStyles.tsx`).
 */
interface CodeTheme {
  name: string;
  type: 'dark' | 'light';
  colors: Record<string, string>;
  tokenColors: { scope: string[]; settings: { foreground: string; fontStyle?: string } }[];
}

interface CodePalette {
  bg: string;
  fg: string;
  comment: string;
  keyword: string;
  string: string;
  fn: string;
  tag: string;
  attribute: string;
  constant: string;
  punctuation: string;
  type: string;
}

function createTheme(name: string, type: 'dark' | 'light', palette: CodePalette): CodeTheme {
  return {
    name,
    type,
    colors: {
      'editor.background': palette.bg,
      'editor.foreground': palette.fg,
    },
    tokenColors: [
      {
        scope: ['comment', 'punctuation.definition.comment'],
        settings: { foreground: palette.comment },
      },
      {
        scope: [
          'keyword',
          'storage',
          'storage.type',
          'storage.modifier',
          'keyword.operator.new',
          'keyword.control',
        ],
        settings: { foreground: palette.keyword },
      },
      {
        scope: ['string', 'string.template', 'punctuation.definition.string'],
        settings: { foreground: palette.string },
      },
      {
        scope: ['entity.name.function', 'support.function', 'meta.function-call'],
        settings: { foreground: palette.fn },
      },
      {
        scope: [
          'entity.name.tag',
          'support.class.component',
          'entity.name.tag.css',
          'entity.other.attribute-name.class.css',
        ],
        settings: { foreground: palette.tag },
      },
      {
        scope: ['entity.other.attribute-name', 'support.type.property-name', 'meta.property-name'],
        settings: { foreground: palette.attribute },
      },
      {
        scope: [
          'constant',
          'constant.numeric',
          'constant.language',
          'support.constant',
          'keyword.other.unit',
          'variable.other.constant',
        ],
        settings: { foreground: palette.constant },
      },
      {
        scope: ['punctuation', 'meta.brace', 'keyword.operator'],
        settings: { foreground: palette.punctuation },
      },
      {
        scope: ['entity.name.type', 'support.type', 'entity.name.class'],
        settings: { foreground: palette.type },
      },
      {
        scope: ['variable', 'meta.definition.variable', 'variable.parameter'],
        settings: { foreground: palette.fg },
      },
    ],
  };
}

export const darkTheme = createTheme('solid-styled-dark', 'dark', {
  bg: '#150c1d',
  fg: '#ede3f3',
  comment: '#a08eb0',
  keyword: '#f58ae6',
  string: '#ffcfa8',
  fn: '#cfa9ff',
  tag: '#ff9ad5',
  attribute: '#e2c4ff',
  constant: '#8fd8ff',
  punctuation: '#bba9c9',
  type: '#a6c8ff',
});

export const lightTheme = createTheme('solid-styled-light', 'light', {
  bg: '#f6eef9',
  fg: '#24122f',
  comment: '#6b5878',
  keyword: '#a11e8e',
  string: '#8a4300',
  fn: '#6a2db8',
  tag: '#b01f77',
  attribute: '#7a3aa8',
  constant: '#00648a',
  punctuation: '#5f4c6c',
  type: '#2853a8',
});
