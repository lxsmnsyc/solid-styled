import { render } from '@solidjs/web';
import { StyleRegistry } from 'solid-styled';
import Main from './App';

const app = document.getElementById('app');

if (app) {
  render(
    () => (
      <StyleRegistry>
        <Main />
      </StyleRegistry>
    ),
    app,
  );
}

const host = document.getElementById('shadow-host');
const shadowDom = host?.attachShadow({ mode: 'open' });

if (shadowDom) {
  render(
    () => (
      <StyleRegistry root={shadowDom}>
        <Main />
      </StyleRegistry>
    ),
    shadowDom,
  );
}
