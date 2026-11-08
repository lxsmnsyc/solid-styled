import type { JSX } from '@solidjs/web';
import { dynamic } from '@solidjs/web';
import { css } from 'solid-styled';

const Button = dynamic(() => 'button');

export default function Forward(): JSX.Element {
  css`
    button {
      padding: 0.5rem 1rem;
      border: 0;
      border-radius: 999px;
      background: var(--gradient-strong);
      color: white;
    }
  `;

  return (
    <>
      <Button type="button" use:solid-styled>
        Forwarded
      </Button>
      <Button type="button">Not forwarded</Button>
    </>
  );
}
