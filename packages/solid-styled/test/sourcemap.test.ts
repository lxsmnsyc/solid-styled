import { TraceMap, originalPositionFor } from '@jridgewell/trace-mapping';
import { describe, expect, it } from 'vitest';
import { compile } from '../compiler';

const FILE = 'src/index.tsx';
const IDENTIFIER = /[A-Za-z_$][\w$]*/g;

/**
 * Checks that every identifier in the output that the map points into the
 * source lands on the same identifier there, and returns the identifiers of
 * `expected` that the map does not cover.
 */
function checkMap(source: string, expected: string[]): string[] {
  const { code, map } = compile(FILE, source);
  const trace = new TraceMap(map);
  const sourceLines = source.split('\n');
  const mapped = new Set<string>();
  for (const [line, text] of code.split('\n').entries()) {
    for (const match of text.matchAll(IDENTIFIER)) {
      const position = originalPositionFor(trace, { line: line + 1, column: match.index });
      if (position.line === null) {
        continue;
      }
      const original = sourceLines[position.line - 1].slice(
        position.column,
        position.column + match[0].length,
      );
      if (original === match[0]) {
        mapped.add(`${match[0]}@${position.line}:${position.column}`);
      }
    }
  }
  const missing: string[] = [];
  for (const name of expected) {
    // `name` is `identifier@line:column` in the source.
    if (!mapped.has(name)) {
      missing.push(name);
    }
  }
  return missing;
}

/** `identifier@line:column` for every occurrence of `text` in the source. */
function locate(source: string, text: string): string[] {
  const out: string[] = [];
  for (const [line, content] of source.split('\n').entries()) {
    let index = content.indexOf(text);
    while (index !== -1) {
      for (const match of text.matchAll(IDENTIFIER)) {
        out.push(`${match[0]}@${line + 1}:${index + match.index}`);
      }
      index = content.indexOf(text, index + 1);
    }
  }
  return out;
}

describe('source map', () => {
  it('maps the interpolations of a css template', () => {
    const source = `import { css } from 'solid-styled';
export function App(props) {
  const label = "ünïcødé 🎉";
  css\`
    div { color: \${props.color}; padding: \${props.size}px; }
  \`;
  return <div onClick={() => props.onClick(label)}>{label}</div>;
}
`;
    const expected = [
      ...locate(source, 'props.color'),
      ...locate(source, 'props.size'),
      ...locate(source, 'props.onClick(label)'),
      ...locate(source, '{label}'),
    ];
    expect(checkMap(source, expected)).toEqual([]);
  });

  it('maps the interpolations of hoisted style elements in order', () => {
    const source = `export function App(props) {
  if (props.hidden) return null;
  return (
    <div {...props.rest}>
      <style jsx>{\`
        div { color: \${props.a}; border: \${props.b}px solid; }
      \`}{\`span { color: red; }\`}{\`p { color: \${props.c}; }\`}</style>
      <style jsx global>{\`
        body { color: \${props.d}; }
      \`}</style>
      <span>{props.title}</span>
    </div>
  );
}
`;
    const { code } = compile(FILE, source);
    // The setup calls keep the template order.
    const order: string[] = [];
    for (const match of code.matchAll(/props\.[a-d]\b/g)) {
      order.push(match[0]);
    }
    expect(order).toEqual(['props.a', 'props.b', 'props.c', 'props.d']);
    expect(code).toContain('_useSolidStyledGlobal(sheet_1, 4, css_4, () => ({');
    expect(code).not.toContain('<style');

    const expected = [
      ...locate(source, 'props.a'),
      ...locate(source, 'props.b'),
      ...locate(source, 'props.c'),
      ...locate(source, 'props.d'),
      ...locate(source, 'props.rest'),
      ...locate(source, 'props.title'),
    ];
    expect(checkMap(source, expected)).toEqual([]);
  });

  it('names the file without its query and embeds the source', () => {
    const source = `export function App() { return <div />; }\n`;
    const { map } = compile(`${FILE}?v=1`, source);
    expect(map.sources).toEqual([FILE]);
    expect(map.sourcesContent).toEqual([source]);
  });
});
