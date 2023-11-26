import { compile } from './dist/esm/development/compiler.mjs';

console.log(
  (await compile('example.ts', `
import { css } from 'solid-styled';

function Example() {
  css\`
  @global {
    :global(div) {
      &:global(div) {
        color: red;
      }
    }
  }
  \`
  
  return <h1>Hello World</h1>;
}
  `, { verbose: true })).code
);