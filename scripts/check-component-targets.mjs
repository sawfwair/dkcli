import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { chromium } from '@playwright/test';

const repository = fileURLToPath(new URL('../', import.meta.url));
const cache = await mkdtemp(join(tmpdir(), 'dk-component-targets-'));
const server = await createServer({
  configFile: false,
  root: repository,
  cacheDir: cache,
  plugins: [svelte({ configFile: false, hot: false })],
  resolve: { alias: { '@dkcli/core': `${repository}packages/core/src/index.ts`, '@dkcli/tokens': `${repository}packages/tokens/src/index.ts` } },
  server: { host: '127.0.0.1', port: 0 }
});
let browser;
const failures = [];
const retainedCompactFindings = [];
try {
  await server.listen();
  const address = server.httpServer.address();
  assert.ok(address && typeof address === 'object');
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 320, height: 960 } });
  page.setDefaultTimeout(15_000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${address.port}/packages/components/src/lib/test-utils/target-size.html`);
  await page.locator('[data-ready=true]').waitFor();
  await page.evaluate(() => document.fonts.ready);
  for (const [component, selector] of [
    ['side-nav', '.side-nav-branch'], ['tree-view', '.tree-branch'], ['text-field', '.field-input'],
    ['dialog', '.dialog-trigger-button'], ['drawer', '.drawer-trigger-button'], ['popover', '.popover-trigger'],
    ['menu', '.menu-trigger'], ['data-grid-lite', '.sort-button'], ['file-upload', '.field-label'], ['table', '.sort-button']
  ]) {
    const target = page.locator(`[data-target="${component}"] ${selector}`);
    const bounds = await target.boundingBox();
    if (!bounds || bounds.width < 44 || bounds.height < 44) failures.push(`${component}: ${bounds?.width ?? 0} × ${bounds?.height ?? 0}; project target criterion is 44 × 44 px.`);
  }
  for (const [component, selector] of [['side-nav', '.side-nav-branch'], ['tree-view', '.tree-branch']]) {
    const branch = page.locator(`[data-disabled="${component}"] ${selector}`);
    if (!await branch.isDisabled()) {
      await branch.click();
      failures.push(`${component}: disabled branch accepted an expansion action.`);
    }
    if (await page.locator(`[data-disabled="${component}"]`).getByRole('button', { name: 'Hidden child', exact: true }).count()) failures.push(`${component}: disabled child became visible.`);
  }
  const steps = page.locator('[data-disabled="stepper"] button');
  for (const step of await steps.all()) if (!await step.isDisabled()) failures.push('stepper: noninteractive step remains an enabled native action.');
  for (const [component, selector] of [['date-picker', '.date-picker-trigger'], ['range-date-picker', '.range-trigger'], ['radio-group', '.radio-item']]) {
    const control = page.locator(`[data-invalid="${component}"] ${selector}`);
    if (await control.getAttribute('data-invalid') !== 'true') failures.push(`${component}: error state is not exposed on the delivered control.`);
    const description = await control.evaluate((element) => element.getAttribute('aria-describedby') ?? element.closest('fieldset')?.getAttribute('aria-describedby'));
    if (!description || !await page.locator(`[id="${description}"]`).isVisible()) failures.push(`${component}: error is not associated with visible guidance.`);
  }
  for (const component of ['dialog', 'drawer']) {
    await page.locator(`[data-target="${component}"] .${component}-trigger-button`).click();
    const surfaceGeometry = await page.locator(`.${component}-surface`).evaluate((surface) => { const bounds = surface.getBoundingClientRect(); const header = surface.querySelector('.dialog-header,.drawer-header'); if (!header) throw new Error('Missing dialog heading'); const range = document.createRange(); range.selectNodeContents(header); return { left: bounds.left, right: bounds.right, headerClientWidth: header.clientWidth, headerScrollWidth: header.scrollWidth, text: [...range.getClientRects()].map((rect) => ({ left: rect.left, right: rect.right })) }; });
    if (surfaceGeometry.left < -1 || surfaceGeometry.right > 321 || surfaceGeometry.headerScrollWidth > surfaceGeometry.headerClientWidth + 1 || surfaceGeometry.text.some((rect) => rect.left < surfaceGeometry.left - 1 || rect.right > surfaceGeometry.right + 1)) failures.push(`${component}: generated surface/header exceeds phone viewport ${JSON.stringify(surfaceGeometry)}`);
    const close = page.locator(`.${component}-close`);
    const bounds = await close.boundingBox();
    if (!bounds || bounds.width < 44 || bounds.height < 44) failures.push(`${component} close: ${bounds?.width ?? 0} × ${bounds?.height ?? 0}; project target criterion is 44 × 44 px.`);
    await close.click();
  }
  for (const [component, trigger, controls] of [
    ['select', '[data-open="select"] .select-trigger', '.select-surface button'],
    ['combobox', '[data-open="combobox"] .combobox-input', '.combobox-surface button'],
    ['command-palette', '[data-command-launch]', '.command-surface input,.command-surface button'],
    ['date-picker', '[data-invalid="date-picker"] .date-picker-trigger', '.date-picker-surface button'],
    ['range-date-picker', '[data-invalid="range-date-picker"] .range-trigger', '.range-surface button'],
    ['menu', '[data-target="menu"] .menu-trigger', '.menu-surface button']
  ]) {
    await page.locator(trigger).click();
    const surface = page.locator(component === 'command-palette' ? '.command-surface' : component === 'range-date-picker' ? '.range-surface' : component === 'date-picker' ? '.date-picker-surface' : `.${component}-surface`);
    const surfaceBounds = await surface.boundingBox();
    if (!surfaceBounds || surfaceBounds.x < -1 || surfaceBounds.x + surfaceBounds.width > 321) failures.push(`${component}: phone surface crosses viewport edge ${JSON.stringify(surfaceBounds)}`);
    const clippedText = await surface.evaluate((element) => { const bounds = element.getBoundingClientRect(); return [...element.querySelectorAll('.calendar-caption,.range-caption')].flatMap((caption) => { const range = document.createRange(); range.selectNodeContents(caption); return [...range.getClientRects()].filter((rect) => rect.left < bounds.left - 1 || rect.right > bounds.right + 1).map((rect) => ({ text: caption.textContent, left: rect.left, right: rect.right })); }); });
    if (clippedText.length) failures.push(`${component}: calendar caption exceeds visible surface ${JSON.stringify(clippedText)}`);
    if (component === 'date-picker' || component === 'range-date-picker') {
      const calendarContent = await surface.evaluate((element) => [...element.querySelectorAll('.calendar-grid,.range-grid,.weekday,.range-weekday')].map((item) => { const bounds = item.getBoundingClientRect(); const range = document.createRange(); range.selectNodeContents(item); return { className: item.className, text: item.matches('.weekday,.range-weekday') ? item.textContent : null, clientWidth: item.clientWidth, scrollWidth: item.scrollWidth, left: bounds.left, right: bounds.right, textRects: item.matches('.weekday,.range-weekday') ? [...range.getClientRects()].map((rect) => ({ left: rect.left, right: rect.right })) : [] }; }));
      for (const item of calendarContent) if (item.scrollWidth > item.clientWidth + 1 || item.textRects.some((rect) => rect.left < item.left - 1 || rect.right > item.right + 1)) failures.push(`${component}: actual calendar content escapes its track ${JSON.stringify(item)}`);
    }
    const actions = page.locator(controls);
    if (!await actions.count()) failures.push(`${component}: expected generated open actions are absent.`);
    for (const action of await actions.all()) {
      if (!await action.isVisible() || await action.isDisabled()) continue;
      const bounds = await action.boundingBox();
      if (bounds && (component === 'range-date-picker' || component === 'date-picker') && await action.evaluate((element) => element.classList.contains('range-day') || element.classList.contains('day')) && (bounds.width < 44 || bounds.height < 44)) {
        retainedCompactFindings.push({ component, caseId: 'open-md', selector: component === 'range-date-picker' ? '.range-surface .range-day' : '.date-picker-surface .day', label: await action.getAttribute('aria-label'), bounds, criterionPx: 44, status: 'fail', classification: 'deliberate-compact', reason: 'Seven-column calendar day layout; preserve compact grid and report the named criterion finding.' });
        continue;
      }
      if (!bounds || bounds.width < 44 || bounds.height < 44) failures.push(`${component} open action ${await action.getAttribute('aria-label') ?? await action.textContent()}: ${bounds?.width ?? 0} × ${bounds?.height ?? 0}; project target criterion is 44 × 44 px.`);
    }
    await page.keyboard.press('Escape');
  }
  for (const selector of ['[data-long="button"]', '[data-long="badge"]', '[data-math="button-solid"]', '[data-math="button-link"]']) {
    const geometry = await page.locator(selector).evaluate((stage) => {
      const control = stage.querySelector('.dk-button,.dk-badge');
      const label = stage.querySelector('.label,.badge-label');
      if (!control || !label) throw new Error('Missing text control');
      const stageBounds = stage.getBoundingClientRect();
      const controlBounds = control.getBoundingClientRect();
      const range = document.createRange(); range.selectNodeContents(label);
      return { stage: { width: stageBounds.width, clientWidth: stage.clientWidth, scrollWidth: stage.scrollWidth }, control: { width: controlBounds.width, clientWidth: control.clientWidth, scrollWidth: control.scrollWidth }, text: [...range.getClientRects()].map((bounds) => ({ left: bounds.left, right: bounds.right, width: bounds.width })), left: controlBounds.left, right: controlBounds.right, content: label.textContent };
    });
    if (geometry.stage.scrollWidth > geometry.stage.clientWidth + 1 || geometry.control.scrollWidth > geometry.control.clientWidth + 1 || geometry.text.some((bounds) => bounds.left < geometry.left - 1 || bounds.right > geometry.right + 1)) failures.push(`${selector}: visible text or control overflow ${JSON.stringify(geometry)}`);
  }
  const label = page.locator('[data-target="file-upload"] .field-label');
  assert.equal(await label.evaluate((element) => element instanceof HTMLLabelElement && element.control?.getAttribute('type') === 'file'), true, 'File label must retain its native chooser association.');
  console.log('Short control geometry:', JSON.stringify(await page.locator('[data-short]').evaluateAll((stages) => stages.map((stage) => { const control = stage.querySelector('.dk-button,.dk-badge'); const bounds = control?.getBoundingClientRect(); return { component: stage.getAttribute('data-short'), width: bounds?.width, height: bounds?.height }; }))));
  const display = page.locator('[data-keyboard="inline-edit"] .inline-display');
  await display.focus(); await page.keyboard.press('Enter');
  const draft = page.locator('[data-keyboard="inline-edit"] .inline-field');
  await draft.fill('Uncommitted draft'); await draft.press('Escape');
  if (!await display.evaluate((element) => document.activeElement === element)) failures.push('inline-edit: Escape removed the input without restoring display focus.');
  if (await display.textContent() !== 'Release notes') failures.push('inline-edit: Escape failed to retain committed value.');
  await display.focus(); await page.keyboard.press('Enter');
  await draft.fill('Committed revision'); await draft.press('Enter');
  if (!await display.evaluate((element) => document.activeElement === element)) failures.push('inline-edit: Enter committed without restoring display focus.');
  if (await display.textContent() !== 'Committed revision') failures.push('inline-edit: Enter failed to commit the draft.');
  const spinner = page.locator('[data-zoom="button"] .spinner-fallback');
  await spinner.scrollIntoViewIfNeeded();
  const ring = await spinner.evaluate(async (element) => { const slot = element.parentElement; if (!slot) throw new Error('Missing spinner slot'); for (const animation of slot.getAnimations({ subtree: true })) { animation.pause(); animation.currentTime = 112.5; } await new Promise((resolve) => requestAnimationFrame(resolve)); const css = getComputedStyle(element); return { size: Number.parseFloat(css.width), borderBoxSize: element.offsetWidth, borderBoxHeight: element.offsetHeight, slotHeight: slot.clientHeight, slotWidth: slot.clientWidth, slotScrollWidth: slot.scrollWidth, ringWidth: element.getBoundingClientRect().width }; });
  if (ring.borderBoxSize > ring.slotWidth || ring.borderBoxHeight > ring.slotHeight || ring.slotScrollWidth > ring.slotWidth + 1) failures.push(`button: generated rotating ring exceeds declared slot ${JSON.stringify(ring)}`);
  console.log('Generated spinner45° geometry:', JSON.stringify(ring));
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  await page.locator('[data-target="dialog"] .dialog-trigger-button').click();
  const zoomDialog = await page.locator('.dialog-surface').evaluate((element) => { const bounds = element.getBoundingClientRect(); return { top: bounds.top, bottom: bounds.bottom, left: bounds.left, right: bounds.right, width: bounds.width, clientWidth: element.clientWidth, scrollWidth: element.scrollWidth, heading: [...element.querySelectorAll('.dialog-header > div')].map((item) => ({ clientWidth: item.clientWidth, scrollWidth: item.scrollWidth })) }; });
  console.log('200% CSS zoom Dialog bounds:', JSON.stringify(zoomDialog));
  if (zoomDialog.top < -1 || zoomDialog.bottom > 961 || zoomDialog.left < -1 || zoomDialog.right > 321 || zoomDialog.scrollWidth > zoomDialog.clientWidth + 1 || zoomDialog.heading.some((item) => item.scrollWidth > item.clientWidth + 1)) failures.push(`dialog: 200% CSS zoom surface overflow ${JSON.stringify(zoomDialog)}`);
  await page.keyboard.press('Escape');
  await page.locator('[data-open="select"] .select-trigger').click();
  const zoomSelect = await page.locator('.select-surface').evaluate((element) => { const bounds = element.getBoundingClientRect(); return { left: bounds.left, right: bounds.right, width: bounds.width, clientWidth: element.clientWidth, scrollWidth: element.scrollWidth }; });
  if (zoomSelect.left < -1 || zoomSelect.right > 321 || zoomSelect.scrollWidth > zoomSelect.clientWidth + 1) failures.push(`select: 200% CSS zoom surface overflow ${JSON.stringify(zoomSelect)}`);
  await page.keyboard.press('Escape');
  for (const component of ['text-field', 'button', 'tabs']) {
    const geometry = await page.locator(`[data-zoom="${component}"]`).evaluate((stage) => { const bounds = stage.getBoundingClientRect(); return { left: bounds.left, right: bounds.right, clientWidth: stage.clientWidth, scrollWidth: stage.scrollWidth, children: [...stage.querySelectorAll('*')].map((element) => ({ tag: element.tagName, className: element.className, width: element.getBoundingClientRect().width, clientWidth: element.clientWidth, scrollWidth: element.scrollWidth })) }; });
    if (geometry.scrollWidth > geometry.clientWidth + 1) failures.push(`${component}: 200% CSS zoom stage overflow ${JSON.stringify(geometry)}`);
  }
  await page.locator('[data-zoom="select"] .select-trigger').click();
  const longSelect = await page.locator('.select-surface').evaluate((element) => { const bounds = element.getBoundingClientRect(); return { left: bounds.left, right: bounds.right, clientWidth: element.clientWidth, scrollWidth: element.scrollWidth }; });
  if (longSelect.left < -1 || longSelect.right > 321 || longSelect.scrollWidth > longSelect.clientWidth + 1) failures.push(`select: 200% CSS zoom long-content overflow ${JSON.stringify(longSelect)}`);
  assert.deepEqual(errors, [], 'Source harness must render without browser errors.');
  assert.deepEqual(failures, [], 'Actual geometry and disabled actions must satisfy the declared project checks.');
  console.log('Component defect regressions: generated open targets, 10 closed targets, 3 disabled component scenarios, and 3 invalid associations passed at 320 px.');
  const findingsPath = join(tmpdir(), 'dk-component-compact-target-findings.json');
  await writeFile(findingsPath, JSON.stringify({ projectCriterionPx: 44, retainedCompactFindings }, null, 2));
  console.log(`Retained ${retainedCompactFindings.length} compact calendar target findings: ${findingsPath}`);
} finally {
  await browser?.close();
  await server.close();
  await rm(cache, { recursive: true, force: true });
}
