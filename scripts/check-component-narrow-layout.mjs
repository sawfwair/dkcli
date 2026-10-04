import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { chromium, webkit } from '@playwright/test';

const repository = fileURLToPath(new URL('../', import.meta.url));
const cache = await mkdtemp(join(tmpdir(), 'dk-component-narrow-'));
const server = await createServer({ configFile: false, root: repository, cacheDir: cache, plugins: [svelte({ configFile: false, hot: false })], resolve: { alias: { '@dkcli/core': `${repository}packages/core/src/index.ts`, '@dkcli/tokens': `${repository}packages/tokens/src/index.ts` } }, server: { host: '127.0.0.1', port: 0 } });
let browser;
let chromiumBrowser;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
async function observeAccordion(page, engine) {
  const expectedText = 'Release readiness for the international workspace, including accessibility review, deployment notes, and remaining dependencies';
  const observation = await page.locator('[data-narrow-accordion]').evaluate((parent) => {
    const bounds = parent.getBoundingClientRect();
    const nodes = [...parent.querySelectorAll('.dk-accordion,.accordion-item,.accordion-trigger,.accordion-copy,.accordion-label,.accordion-description,.accordion-panel,.accordion-panel p')].map((element) => {
      const bounds = element.getBoundingClientRect();
      const parentBounds = element.parentElement.getBoundingClientRect();
      const text = element.matches('.accordion-label,.accordion-description,.accordion-panel p');
      const range = document.createRange();
      if (text) range.selectNodeContents(element);
      return { selector: element.className || element.tagName.toLowerCase(), text: text ? element.textContent : null, width: bounds.width, height: bounds.height, fontSize: Number.parseFloat(getComputedStyle(element).fontSize), left: bounds.left, right: bounds.right, parentLeft: parentBounds.left, parentRight: parentBounds.right, clientWidth: element.clientWidth, scrollWidth: element.scrollWidth, ranges: text ? [...range.getClientRects()].map((rect) => ({ left: rect.left, right: rect.right })) : [] };
    });
    return { logicalWidth: parent.clientWidth, physicalWidth: bounds.width, nodes };
  });
  const failures = [];
  for (const node of observation.nodes) {
    if (node.scrollWidth > node.clientWidth + 1 || node.left < node.parentLeft - 1 || node.right > node.parentRight + 1) failures.push(`${engine}: Accordion ${node.selector} escapes its allocated row.`);
    if (node.text !== null && node.text !== expectedText) failures.push(`${engine}: Accordion ${node.selector} loses complete long content.`);
    if (node.ranges.some((rect) => rect.left < node.parentLeft - 1 || rect.right > node.parentRight + 1)) failures.push(`${engine}: Accordion ${node.selector} paints text outside its parent.`);
    if (node.selector.includes('accordion-trigger') && (node.width / 2 < 44 || node.height / 2 < 44)) failures.push(`${engine}: Accordion trigger misses the named 44px logical target criterion.`);
    if (node.selector.includes('accordion-copy') && node.width / 2 < node.fontSize) failures.push(`${engine}: Accordion copy has less than one em of readable glyph width.`);
  }
  const trigger = page.locator('[data-narrow-accordion] .accordion-trigger').first();
  await trigger.focus();
  await trigger.press('Enter');
  assert.equal(await trigger.getAttribute('aria-expanded'), 'false', 'Enter must close the initial disclosure.');
  await trigger.press('Enter');
  assert.equal(await trigger.getAttribute('aria-expanded'), 'true', 'Enter must reopen the disclosure.');
  return { component: 'accordion-zoom', engine, ...observation, failures };
}
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
  observations.push({ component: 'empty-state', engine: 'webkit', ...empty });
  if (empty.scrollWidth > empty.clientWidth + 1 || empty.text.some((rect) => rect.left < empty.left - 1 || rect.right > empty.right + 1)) failures.push('EmptyState complete text escapes its native section.');
  const trigger = await page.locator('.dialog-trigger-button').evaluate((element) => { const bounds = element.getBoundingClientRect(); const parent = element.parentElement.getBoundingClientRect(); return { left: bounds.left, right: bounds.right, parentLeft: parent.left, parentRight: parent.right }; });
  observations.push({ component: 'dialog-trigger', engine: 'webkit', ...trigger });
  if (trigger.left < trigger.parentLeft - 1 || trigger.right > trigger.parentRight + 1) failures.push('Dialog generated trigger escapes its allocated row.');
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  await page.locator('.dialog-trigger-button').click();
  const dialog = await page.locator('.dialog-surface').evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return { left: bounds.left, right: bounds.right, top: bounds.top, bottom: bounds.bottom, clientWidth: element.clientWidth, scrollWidth: element.scrollWidth, actions: [...element.querySelectorAll('.dialog-close,.footer-action')].map((action) => { const row = action.parentElement; const rect = action.getBoundingClientRect(); const parent = row.getBoundingClientRect(); return { label: action.textContent, width: rect.width, height: rect.height, left: rect.left, right: rect.right, parentLeft: parent.left, parentRight: parent.right, parentClientWidth: row.clientWidth, parentScrollWidth: row.scrollWidth }; }) };
  });
  observations.push({ component: 'dialog-zoom', engine: 'webkit', ...dialog });
  if (dialog.left < -1 || dialog.right > 321 || dialog.top < -1 || dialog.bottom > 961 || dialog.scrollWidth > dialog.clientWidth + 1) failures.push('Dialog surface escapes its bounded viewport.');
  for (const action of dialog.actions) if (action.width / 2 < 44 || action.height / 2 < 44 || action.left < action.parentLeft - 1 || action.right > action.parentRight + 1 || action.parentScrollWidth > action.parentClientWidth + 1) failures.push(`Dialog ${action.label} escapes its allocated row or misses the named 44px logical target criterion at CSS zoom 2.`);
  await page.locator('.dialog-close').click();
  assert.equal(await page.locator('.dialog-trigger-button').evaluate((element) => document.activeElement === element), true, 'Close must restore trigger focus.');
  const webkitAccordion = await observeAccordion(page, 'webkit');
  observations.push(webkitAccordion);
  failures.push(...webkitAccordion.failures);
  chromiumBrowser = await chromium.launch({ headless: true });
  const chromiumPage = await chromiumBrowser.newPage({ viewport: { width: 320, height: 960 } });
  chromiumPage.on('pageerror', (error) => errors.push(error.message));
  await chromiumPage.goto(`http://127.0.0.1:${address.port}/packages/components/src/lib/test-utils/narrow-layout.html`);
  await chromiumPage.locator('[data-ready=true]').waitFor();
  await chromiumPage.evaluate(async () => { await document.fonts.load('16px ABeeZee'); await document.fonts.ready; document.documentElement.style.zoom = '2'; });
  const chromiumAccordion = await observeAccordion(chromiumPage, 'chromium');
  observations.push(chromiumAccordion);
  failures.push(...chromiumAccordion.failures);
  const receipt = { browsers: ['webkit', 'chromium'], viewport: { width: 320, height: 960 }, zoom: 2, font: 'same-origin ABeeZee', observations, failures };
  await writeFile(join(tmpdir(), 'dk-component-narrow-layout.json'), JSON.stringify(receipt, null, 2));
  console.log(JSON.stringify(receipt, null, 2));
  assert.deepEqual(errors, [], 'Source widgets must render without browser errors.');
  assert.deepEqual(failures, [], 'Narrow source widget content and generated actions must fit.');
} finally {
  await chromiumBrowser?.close();
  await browser?.close();
  await server.close();
  await rm(cache, { recursive: true, force: true });
}
