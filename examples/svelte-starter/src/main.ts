import App from './App.svelte';

const target = document.getElementById('app');

if (!target) {
  throw new Error('Expected #app mount node in starter app');
}

const app = new App({
  target
});

export default app;
