import * as babel from '@babel/core';
import plugin from 'babel-plugin-solid-styled';

babel.transformAsync(`
import { css } from 'solid-styled';
function Test() {
  const [color, setColor] = createSignal('red');
  return (
    <>
      <style jsx>
      {\`
        .toggle {
          width: 50vw;
          padding: 0.5rem;
          border: none;
          color: white;
          font-size: 2rem;
          border-radius: 0.5rem;
          background-color: #111827;
        }
      \`}
    </style>
    <style jsx>
      {/* css */\`
        div > button {
          width: 50vw;
          padding: 0.5rem;
          border: none;
          color: white;
          font-size: 2rem;
          /* border-radius: 0.5rem; */
          background-color: \${red() ? '#ef4444' : '#3b82f6'};
        }
      \`}
    </style>
    <style jsx></style>
    <button class="toggle" type="button" onClick={() => setShow(!show())}>
      {show() ? 'Hide Div' : 'Show Div'}
    </button>
    <Show when={show()}>
      <div>
        <button
          type="button"
          onClick={() => setRed(!red())}
          style={{
            'border-radius': '0.5rem',
          }}
        >
          {red() ? 'Red' : 'Blue'}
        </button>
      </div>
    </Show>
    </>
  );
}
`, {
  plugins: [
    [plugin, { verbose: true }]
  ],
  parserOpts: {
    plugins: [
      'jsx'
    ]
  }
}).then((result) => console.log(result.code));