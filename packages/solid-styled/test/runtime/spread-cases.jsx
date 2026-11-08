import { css } from 'solid-styled';

// A reactive spread after an explicit style.
export function SignalSource(props) {
  // oxlint-disable-next-line no-unused-expressions
  css`
    div {
      color: ${props.color};
    }
  `;
  return <div id="signal" style="margin: 0px" {...props.attrs()} />;
}

// An accessor spread: Solid calls the function to read the source.
export function AccessorSource(props) {
  // oxlint-disable-next-line no-unused-expressions
  css`
    div {
      color: ${props.color};
    }
  `;
  const src = props.src;
  return <div id="accessor" {...src} />;
}
