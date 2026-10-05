import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { chromium } from '@playwright/test';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { createServer } from 'vite';

const repository = fileURLToPath(new URL('../../../../', import.meta.url));
const harnessId = join(repository, '__native-form-probe.svelte');
const baseline = process.env.DK_FORM_BASELINE === '1';
const baselineFiles = new Set([
  'select/Select.svelte', 'combobox/Combobox.svelte',
  'date-picker/DatePicker.svelte', 'range-date-picker/RangeDatePicker.svelte'
].map((path) => join(repository, 'packages/components/src/lib', path)));
const source = `
<script>
  import Select from '/packages/components/src/lib/select/Select.svelte';
  import Combobox from '/packages/components/src/lib/combobox/Combobox.svelte';
  import DatePicker from '/packages/components/src/lib/date-picker/DatePicker.svelte';
  import RangeDatePicker from '/packages/components/src/lib/range-date-picker/RangeDatePicker.svelte';
  let populated = false;
  let disabled = false;
  const submissions = { select: [], combobox: [], date: [], range: [] };
  window.__nativeForms = { submissions, populate: () => { populated = true; }, disable: () => { disabled = true; } };
  function submit(event, field) {
    event.preventDefault();
    submissions[field].push([...new FormData(event.currentTarget)]);
  }
</script>
<main data-ready="true">
  <form data-field="select" onsubmit={(event) => submit(event, 'select')}>
    <Select label="Environment" name="environment" required {disabled} value={populated ? 'production' : undefined} items={[{ value: 'production', label: 'Production' }]} />
  </form>
  <form data-field="combobox" onsubmit={(event) => submit(event, 'combobox')}>
    <Combobox label="Reviewer" name="reviewer" required {disabled} value={populated ? 'ada' : undefined} items={[{ value: 'ada', label: 'Ada' }]} />
  </form>
  <form data-field="date" onsubmit={(event) => submit(event, 'date')}>
    <DatePicker label="Launch date" name="launch" required {disabled} value={populated ? '2026-04-16' : undefined} />
  </form>
  <form data-field="range" onsubmit={(event) => submit(event, 'range')}>
    <RangeDatePicker label="Release window" name="window" required {disabled} value={populated ? { start: '2026-04-16', end: '2026-04-20' } : { start: '2026-04-16' }} />
  </form>
</main>
<style>main { display:grid; gap:1rem; width:320px; } form { margin:0; }</style>
`;

test('custom required selections enforce native submission without duplicate controls or values', async () => {
  const cache = await mkdtemp(join(tmpdir(), 'dk-native-form-'));
  const server = await createServer({
    configFile: false, root: repository, cacheDir: cache,
    plugins: [{
      name: 'native-form-probe', enforce: 'pre',
      resolveId(id) { if (id === 'virtual:native-form.svelte') return harnessId; },
      load(id) {
        if (id === harnessId) return source;
        if (baseline && baselineFiles.has(id)) {
          return execFileSync('git', ['show', `HEAD:${relative(repository, id)}`], { cwd: repository, encoding: 'utf8' });
        }
      },
      configureServer(server) {
        server.middlewares.use('/native-form', async (_request, response, next) => {
          try {
            const html = await server.transformIndexHtml('/native-form', '<!doctype html><html><body><div id="app"></div><script type="module">import { mount } from "svelte"; import App from "virtual:native-form.svelte"; mount(App, { target: document.getElementById("app") });</script></body></html>');
            response.setHeader('Content-Type', 'text/html'); response.end(html);
          } catch (error) { next(error); }
        });
      }
    }, svelte({ configFile: false, hot: false })],
    resolve: { alias: { '@dkcli/core': join(repository, 'packages/core/src/index.ts'), '@dkcli/tokens': join(repository, 'packages/tokens/src/index.ts') } },
    server: { host: '127.0.0.1', port: 0 }
  });
  let browser;
  try {
    await server.listen();
    const address = server.httpServer.address();
    assert.ok(address && typeof address === 'object');
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${address.port}/native-form`);
    await page.locator('[data-ready=true]').waitFor();
    const invalid = [];
    for (const field of ['select', 'combobox', 'date', 'range']) {
      invalid.push(await page.locator(`form[data-field=${field}]`).evaluate((form) => {
        const valid = form.checkValidity();
        form.requestSubmit();
        const control = form.querySelector('button, input[role=combobox]');
        const constraint = form.querySelector('.selection-constraint');
        const controlBounds = control.getBoundingClientRect();
        return { field: form.dataset.field, valid, submitted: window.__nativeForms.submissions[form.dataset.field].length, focusForwarded: document.activeElement === control, controlWidth: controlBounds.width, controlHeight: controlBounds.height, proxyPosition: constraint ? getComputedStyle(constraint).position : null };
      }));
    }
    await writeFile(`/tmp/dk-native-form-browser-${baseline ? 'red' : 'green'}-receipt.json`, JSON.stringify({ baseline, invalid, errors }, null, 2));
    assert.deepEqual(invalid.filter((row) => row.valid || row.submitted || !row.focusForwarded), [], 'Empty and partial required fields must block requestSubmit and focus their real control.');
    assert.equal(await page.getByRole('textbox').count(), 0, 'Validation proxies must not expose extra accessible textboxes.');
    for (const row of invalid.filter((row) => row.proxyPosition)) assert.equal(row.proxyPosition, 'absolute', 'Proxy validation must not consume a layout track.');
    await page.getByRole('combobox', { name: 'Reviewer' }).fill('Ada');
    assert.equal(await page.locator('form[data-field=combobox]').evaluate((form) => form.checkValidity()), false, 'Uncommitted query text must remain invalid.');
    await page.evaluate(() => window.__nativeForms.populate());
    await page.waitForFunction(() => [...document.querySelectorAll('form')].every((form) => form.checkValidity()));
    const submitted = await page.evaluate(() => {
      for (const form of document.querySelectorAll('form')) form.requestSubmit();
      return window.__nativeForms.submissions;
    });
    assert.deepEqual(submitted, {
      select: [[['environment', 'production']]], combobox: [[['reviewer', 'ada']]],
      date: [[['launch', '2026-04-16']]], range: [[['window[start]', '2026-04-16'], ['window[end]', '2026-04-20']]]
    });
    await page.evaluate(() => window.__nativeForms.disable());
    await page.waitForFunction(() => [...document.querySelectorAll('form input')].every((input) => input.disabled));
    const disabled = await page.evaluate(() => [...document.querySelectorAll('form')].map((form) => ({ field: form.dataset.field, valid: form.checkValidity(), values: [...new FormData(form)] })));
    for (const row of disabled) { assert.equal(row.valid, true); assert.deepEqual(row.values, []); }
    assert.deepEqual(errors, []);
    await writeFile('/tmp/dk-native-form-browser-green-receipt.json', JSON.stringify({ baseline, invalid, submitted, disabled, errors }, null, 2));
  } finally {
    await browser?.close(); await server.close(); await rm(cache, { recursive: true, force: true });
  }
});
