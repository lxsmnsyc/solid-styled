import type { JSX } from '@solidjs/web';
import { css } from 'solid-styled';

function Frame(props: { children: JSX.Element }): JSX.Element {
  return <div>{props.children}</div>;
}

function Foreign(): JSX.Element {
  return <p>Rendered by Foreign</p>;
}

export default function Boundary(): JSX.Element {
  css`
    p {
      color: var(--accent);
      font-weight: 700;
    }
  `;

  return (
    <>
      <p>Written here</p>
      <Frame>
        <p>Passed as children</p>
      </Frame>
      <Foreign />
    </>
  );
}
