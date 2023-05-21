import { compile } from './dist/esm/development/compiler.mjs';

const code = `
import { css } from 'solid-styled';

function Example() {
  css\`
    @global {
      h1 {
        color: blue;
      }
    }
  \`
  
  return <h1>Hello World</h1>
}
`;

console.log((await compile('test.tsx', code, {
  verbose: false,
  prefix: undefined,
  env: 'development',
  browserslist: '>0.5%',
})).code);