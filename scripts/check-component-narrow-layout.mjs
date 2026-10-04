import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { chromium, firefox, webkit } from '@playwright/test';

const repository = fileURLToPath(new URL('../', import.meta.url));
const cache = await mkdtemp(join(tmpdir(), 'dk-component-narrow-'));
const server = await createServer({ configFile: false, root: repository, cacheDir: cache, plugins: [svelte({ configFile: false, hot: false })], resolve: { alias: { '@dkcli/core': `${repository}packages/core/src/index.ts`, '@dkcli/tokens': `${repository}packages/tokens/src/index.ts` } }, server: { host: '127.0.0.1', port: 0 } });
let browser;
let chromiumBrowser;
let firefoxBrowser;

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
  firefoxBrowser = await firefox.launch({ headless: true });
  const firefoxPage = await firefoxBrowser.newPage({ viewport: { width: 320, height: 960 } });
  firefoxPage.on('pageerror', (error) => errors.push(error.message));
  await firefoxPage.goto(`http://127.0.0.1:${address.port}/packages/components/src/lib/test-utils/narrow-layout.html`);
  await firefoxPage.locator('[data-ready=true]').waitFor();
  await firefoxPage.evaluate(async () => { await document.fonts.load('16px ABeeZee'); await document.fonts.ready; document.documentElement.style.zoom = '2'; });
  const input = firefoxPage.locator('[data-narrow-combobox] input[role=combobox]');
  await input.scrollIntoViewIfNeeded();
  await input.focus();
  await firefoxPage.locator('.combobox-surface').waitFor({ state: 'visible' });
  await firefoxPage.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const combobox = await firefoxPage.locator('.combobox-surface').evaluate((surface) => [surface, ...surface.querySelectorAll('.combobox-item,.combobox-item-copy,.combobox-item-label,.combobox-item-description')].map((element) => {
    const bounds = element.getBoundingClientRect();
    const parent = element.parentElement.getBoundingClientRect();
    const css = getComputedStyle(element);
    const text = element.matches('.combobox-item-label,.combobox-item-description');
    const range = document.createRange();
    if (text) range.selectNodeContents(element);
    return { selector: element.getAttribute('class'), text: text ? element.textContent : null, width: bounds.width, height: bounds.height, left: bounds.left, right: bounds.right, parentLeft: parent.left, parentRight: parent.right, clientWidth: element.clientWidth, scrollWidth: element.scrollWidth, css: { boxSizing: css.boxSizing, width: css.width, minWidth: css.minWidth, paddingLeft: css.paddingLeft, paddingRight: css.paddingRight, gridTemplateColumns: css.gridTemplateColumns, flexShrink: css.flexShrink, overflowWrap: css.overflowWrap, fontFamily: css.fontFamily, fontSize: css.fontSize }, ranges: text ? [...range.getClientRects()].map((rect) => ({ left: rect.left, right: rect.right })) : [] };
  }));
  observations.push({ component: 'combobox-zoom', engine: 'firefox', geometry: combobox });
  assert.deepEqual(combobox.filter((node) => node.selector.includes('combobox-item-label')).map((node) => node.text), ['Cobalt', 'Sage', 'Ember'], 'Complete option labels must remain visible.');
  assert.deepEqual(combobox.filter((node) => node.selector.includes('combobox-item-description')).map((node) => node.text), ['High-energy release system.', 'Calmer operational workspace.', 'Dark high-contrast command mode.'], 'Complete option descriptions must remain visible.');
  for (const node of combobox) {
    if (node.scrollWidth > node.clientWidth + 1) failures.push(`firefox: Combobox ${node.selector} overflows its allocated width.`);
    if (node.selector.includes('combobox-item') && (node.left < node.parentLeft - 1 || node.right > node.parentRight + 1 || node.ranges.some((rect) => rect.left < node.parentLeft - 1 || rect.right > node.parentRight + 1))) failures.push(`firefox: Combobox ${node.selector} paints outside its parent.`);
    if (node.selector.split(' ').includes('combobox-item') && (node.width / 2 < 44 || node.height / 2 < 44)) failures.push('firefox: Combobox option misses the named 44px logical target criterion.');
  }
  await input.press('ArrowDown');
  await input.press('Enter');
  assert.equal(await input.inputValue(), 'Sage', 'ArrowDown and Enter must select the next enabled option.');
  assert.equal(await input.getAttribute('aria-expanded'), 'false', 'Selecting an option must close the list.');
  await input.press('ArrowDown');
  const selectedOption = firefoxPage.locator('.combobox-item[aria-selected=true]');
  await selectedOption.waitFor({ state: 'visible' });
  const selection = await selectedOption.evaluate((option) => {
    const mark = option.querySelector('[aria-hidden=true]');
    const bounds = option.getBoundingClientRect();
    const icon = mark?.getBoundingClientRect();
    const label = option.querySelector('.combobox-item-label');
    const description = option.querySelector('.combobox-item-description');
    return { label: label?.textContent, description: description?.textContent, clientWidth: option.clientWidth, scrollWidth: option.scrollWidth, left: bounds.left, right: bounds.right, mark: mark?.textContent, icon: icon ? { width: icon.width, height: icon.height, left: icon.left, right: icon.right } : null };
  });
  observations.push({ component: 'combobox-selected-zoom', engine: 'firefox', ...selection });
  assert.equal(selection.label, 'Sage');
  assert.equal(selection.description, 'Calmer operational workspace.');
  assert.equal(selection.mark, '✓', 'The selected option must retain its visible selection adornment.');
  assert.ok(selection.icon && selection.icon.width > 0 && selection.icon.height > 0 && selection.icon.left >= selection.left - 1 && selection.icon.right <= selection.right + 1, 'The selection adornment must fit inside its option.');
  if (selection.scrollWidth > selection.clientWidth + 1) failures.push('firefox: The selected Combobox option overflows its allocated width.');
  await input.press('Escape');
  assert.equal(await input.getAttribute('aria-expanded'), 'false', 'Escape must close the reopened selected list.');
  const receipt = { browsers: ['webkit', 'chromium', 'firefox'], viewport: { width: 320, height: 960 }, zoom: 2, font: 'same-origin ABeeZee', observations, failures };
  await writeFile(join(tmpdir(), 'dk-component-narrow-layout.json'), JSON.stringify(receipt, null, 2));
  console.log(JSON.stringify(receipt, null, 2));
  assert.deepEqual(errors, [], 'Source widgets must render without browser errors.');
  assert.deepEqual(failures, [], 'Narrow source widget content and generated actions must fit.');
} finally {
  await firefoxBrowser?.close();
  await chromiumBrowser?.close();
  await browser?.close();
  await server.close();
  await rm(cache, { recursive: true, force: true });
}
