import { createSignal, JSX, Show } from 'solid-js';
import { css } from 'solid-styled';

function ShowButton(): JSX.Element {
  const [show, setShow] = createSignal(false);
  const [red, setRed] = createSignal(false);

  css`
    .toggle {
      width: 50vw;
      padding: 0.5rem;
      border: none;
      color: white;
      font-size: 2rem;
      border-radius: 0.5rem;
      background-color: #111827;
    }
  `;
  css`
    div > button {
      width: 50vw;
      padding: 0.5rem;
      border: none;
      color: white;
      font-size: 2rem;
      /* border-radius: 0.5rem; */
      background-color: ${red() ? '#ef4444' : '#3b82f6'};
    }
  `;

  return (
    <>
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

export default function App(): JSX.Element {
  css`
    :global(body) {
      padding: 0;
      margin: 0;
      width: 100%;
      min-height: 100vh;

      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* You can also do this! */
    /* 
    @global {
      body {
        width: 100%;
        min-height: 100vh;

        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
    */

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
      <ToggleButton use:solid-styled />
      <ToggleButton />
      <ShowButton />
    </div>
  );
}
