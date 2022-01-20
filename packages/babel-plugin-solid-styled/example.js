const babel = require('@babel/core');
const plugin = require('./dist/cjs/development');

babel.transformAsync(`
import { css } from 'solid-styled';
function Test() {
  return (
    <div>
      <style jsx global>
        {\`
          div {
            background-color: black;
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