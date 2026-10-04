import App from './App.svelte';
import { mount } from 'svelte';

const target = document.getElementById('app');

if (!target) {
  throw new Error('Expected #app mount node in starter app');
}

const app = mount(App, { target });

export default app;
