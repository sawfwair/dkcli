import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { createServer } from 'node:net';

const probe = createServer();
await new Promise((resolve) => probe.listen(0, '127.0.0.1', resolve));
const address = probe.address();
assert(address && typeof address !== 'string');
const port = address.port;
await new Promise((resolve) => probe.close(resolve));
const origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['build'], { env: { ...process.env, HOST: '127.0.0.1', PORT: String(port), ORIGIN: origin }, stdio: ['ignore', 'pipe', 'pipe'] });
let logs = '';
server.stdout.on('data', (value) => { logs += String(value); });
server.stderr.on('data', (value) => { logs += String(value); });
const cookies = new Map();

/** @param {Response} response @returns {void} */
function remember(response) {
  for (const header of response.headers.getSetCookie()) {
    const pair = header.split(';')[0];
    const separator = pair.indexOf('=');
    cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
  }
}

/** @param {string} action @param {Record<string,string>} fields @returns {Promise<Response>} */
async function post(action, fields) {
  const response = await fetch(`${origin}/?/${action}`, { method: 'POST', headers: { origin, accept: 'text/html', cookie: [...cookies].map(([name, value]) => `${name}=${value}`).join('; ') }, body: new URLSearchParams(fields), redirect: 'manual' });
  remember(response);
  return response;
}

/** @returns {Promise<string>} */
async function page() {
  const response = await fetch(origin, { headers: { cookie: [...cookies].map(([name, value]) => `${name}=${value}`).join('; ') } });
  assert.equal(response.status, 200);
  return response.text();
}

try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error(`Server exited: ${logs}`);
    try { if ((await fetch(origin)).ok) { ready = true; break; } } catch { /* Server is starting. */ }
    await delay(100);
  }
  assert(ready, `Server did not start: ${logs}`);
  const initial = await page();
  assert.match(initial, /data-designkit-theme/);
  assert.match(initial, /--action-bg: var\(--color-primary\)/);
  assert.match(initial, /Atlas/);
  const invalid = await post('create', { title: '', owner: '', environment: 'Invalid' });
  assert.equal(invalid.status, 400);
  assert.match(await invalid.text(), /Correct the marked fields/);
  assert.equal((await post('create', { title: 'Server smoke release', owner: 'Casey', environment: 'Production' })).status, 200);
  assert.match(await page(), /Server smoke release/);
  assert.equal((await post('update', { id: 'RL-105', status: 'Ready' })).status, 200);
  assert.match(await page(), /Server smoke release/);
  const exported = { name: 'Smoke theme', seed: { color: '#28634e', mode: 'dark', density: 'compact', ratio: 1.333, motion: 'snappy' }, families: { color: { primary: 'untrusted' } } };
  assert.equal((await post('theme', { themeJson: JSON.stringify(exported) })).status, 200);
  const themed = await page();
  assert.match(themed, /Smoke theme/);
  assert.match(themed, /data-mode="dark"/);
  assert.doesNotMatch(themed, /untrusted/);
  assert.equal((await post('theme', { themeJson: '{broken' })).status, 400);
  assert.match(await page(), /Smoke theme/);
  assert.equal((await post('reset', {})).status, 200);
  assert.doesNotMatch(await page(), /Server smoke release/);
  console.log('Built SvelteKit server: SSR theme, validation, create/update persistence, JSON import, reset passed.');
} finally {
  server.kill('SIGTERM');
  await new Promise((resolve) => { if (server.exitCode !== null) resolve(); else server.once('exit', resolve); });
}
