const babel = require('@babel/core');
const plugin = require('./dist/cjs/development');

babel.transformAsync(`
import { css } from 'solid-styled';
function Test() {
  const [color, setColor] = createSignal('red');
  return (
    <div>
      <style jsx>
        {\`
          div {
            background-color: \${color()};
          }
        \`}
      </style>
      <h1>Hello World</h1>
    </div>
  );
}
`, {
  plugins: [
    plugin
  ],
  parserOpts: {
    plugins: [
      'jsx'
    ]
  }
}).then((result) => console.log(result.code));