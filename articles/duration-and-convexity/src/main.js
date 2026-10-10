import { mount } from "svelte";
import App from "./App.svelte";

// Svelte 5 mounts with mount(), not `new App({ target })`.
export default mount(App, { target: document.body });
