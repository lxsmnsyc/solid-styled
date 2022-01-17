const babel = require('@babel/core');
const plugin = require('./dist/cjs/development');

babel.transformAsync(`
import { createSignal } from 'solid-js';
import { css } from 'solid-styled';

function A() {
  const [color, setColor] = createSignal('red');
  css\`
    h1 {
      color: \${color()};
    }
  \`;

  return (
    <>
      <h1>Hello World</h1>
      <Container>
        <div>Hello Hello</div>
      </Container>
    </>
  );
}
`, {
  plugins: [
    plugin,
  ],
  parserOpts: {
    plugins: [
      'jsx'
    ]
  }
}).then((result) => {
  console.log(result.code);
});
