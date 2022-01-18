import { createSignal, JSX } from 'solid-js';
import { css, StyleRegistry } from 'solid-styled';

function ToggleButton(): JSX.Element {
  const [show, setShow] = createSignal(false);

  function onClick() {
    setShow(!show());
  }

  css`
    button {
      width: 50vw;
      padding: 0.5rem;
      border: none;
      color: white;
      font-size: 2rem;
      border-radius: 0.5rem;
      background-color: ${show() ? '#ef4444' : '#3b82f6'};
    }
  `;

  return (
    <button type="button" onClick={onClick}>
      {show() ? 'Red' : 'Blue'}
    </button>
  );
}

function Main(): JSX.Element {
  css`
    :global(body) {
      width: 100%;
      min-height: 100vh;

      display: flex;
      align-items: center;
      justify-content: center;
    }

    div {
      display: flex;
      flex-direction: column;
    }

    div > :global(* + *) {
      margin-top: 0.5rem;
    }
  `;

  return (
    <div>
      <ToggleButton />
      <ToggleButton />
    </div>
  );
}

export default function App(): JSX.Element {
  return (
    <StyleRegistry>
      <Main />
    </StyleRegistry>
  );
}
