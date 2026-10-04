import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { webkit } from '@playwright/test';

const repository = fileURLToPath(new URL('../', import.meta.url));
const cache = await mkdtemp(join(tmpdir(), 'dk-component-narrow-'));
const server = await createServer({ configFile: false, root: repository, cacheDir: cache, plugins: [svelte({ configFile: false, hot: false })], resolve: { alias: { '@dkcli/core': `${repository}packages/core/src/index.ts`, '@dkcli/tokens': `${repository}packages/tokens/src/index.ts` } }, server: { host: '127.0.0.1', port: 0 } });
let browser;
try {
  await server.listen();
  const address = server.httpServer.address();
  assert.ok(address && typeof address === 'object');
  browser = await webkit.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 320, height: 960 } });
  page.setDefaultTimeout(15_000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${address.port}/packages/components/src/lib/test-utils/narrow-layout.html`);
  await page.locator('[data-ready=true]').waitFor();
  await page.evaluate(async () => { await document.fonts.load('16px ABeeZee'); await document.fonts.ready; });
  const failures = [];
  const observations = [];
  const empty = await page.locator('.dk-empty-state').evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return { left: bounds.left, right: bounds.right, clientWidth: element.clientWidth, scrollWidth: element.scrollWidth, text: [...element.querySelectorAll('.empty-title,.empty-description')].flatMap((child) => { const range = document.createRange(); range.selectNodeContents(child); return [...range.getClientRects()].map((rect) => ({ left: rect.left, right: rect.right })); }) };
  });
  observations.push({ component: 'empty-state', ...empty });
  if (empty.scrollWidth > empty.clientWidth + 1 || empty.text.some((rect) => rect.left < empty.left - 1 || rect.right > empty.right + 1)) failures.push('EmptyState complete text escapes its native section.');
  const trigger = await page.locator('.dialog-trigger-button').evaluate((element) => { const bounds = element.getBoundingClientRect(); const parent = element.parentElement.getBoundingClientRect(); return { left: bounds.left, right: bounds.right, parentLeft: parent.left, parentRight: parent.right }; });
  observations.push({ component: 'dialog-trigger', ...trigger });
  if (trigger.left < trigger.parentLeft - 1 || trigger.right > trigger.parentRight + 1) failures.push('Dialog generated trigger escapes its allocated row.');
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  await page.locator('.dialog-trigger-button').click();
  const dialog = await page.locator('.dialog-surface').evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return { left: bounds.left, right: bounds.right, top: bounds.top, bottom: bounds.bottom, clientWidth: element.clientWidth, scrollWidth: element.scrollWidth, actions: [...element.querySelectorAll('.dialog-close,.footer-action')].map((action) => { const row = action.parentElement; const rect = action.getBoundingClientRect(); const parent = row.getBoundingClientRect(); return { label: action.textContent, width: rect.width, height: rect.height, left: rect.left, right: rect.right, parentLeft: parent.left, parentRight: parent.right, parentClientWidth: row.clientWidth, parentScrollWidth: row.scrollWidth }; }) };
  });
  observations.push({ component: 'dialog-zoom', ...dialog });
  if (dialog.left < -1 || dialog.right > 321 || dialog.top < -1 || dialog.bottom > 961 || dialog.scrollWidth > dialog.clientWidth + 1) failures.push('Dialog surface escapes its bounded viewport.');
  for (const action of dialog.actions) if (action.width / 2 < 44 || action.height / 2 < 44 || action.left < action.parentLeft - 1 || action.right > action.parentRight + 1 || action.parentScrollWidth > action.parentClientWidth + 1) failures.push(`Dialog ${action.label} escapes its allocated row or misses the named 44px logical target criterion at CSS zoom 2.`);
  await page.locator('.dialog-close').click();
  assert.equal(await page.locator('.dialog-trigger-button').evaluate((element) => document.activeElement === element), true, 'Close must restore trigger focus.');
  const receipt = { browser: 'webkit', viewport: { width: 320, height: 960 }, zoom: 2, font: 'same-origin ABeeZee', observations, failures };
  await writeFile(join(tmpdir(), 'dk-component-narrow-layout.json'), JSON.stringify(receipt, null, 2));
  console.log(JSON.stringify(receipt, null, 2));
  assert.deepEqual(errors, [], 'Source widgets must render without browser errors.');
  assert.deepEqual(failures, [], 'Narrow source widget content and generated actions must fit.');
} finally {
  await browser?.close();
  await server.close();
  await rm(cache, { recursive: true, force: true });
}
