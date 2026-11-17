import { render } from "@solidjs/web";
import App from "./App";

const app = document.getElementById("app");

if (app) {
  render(() => <App />, app);
}

const host = document.getElementById("shadow-host");
const shadowDom = host?.attachShadow({ mode: "open" });

if (shadowDom) {
  render(() => <App />, shadowDom);
}
