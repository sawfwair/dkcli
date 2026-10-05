import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { chromium } from '@playwright/test';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { createServer } from 'vite';

const repository = fileURLToPath(new URL('../../../../', import.meta.url));
const harnessId = join(repository, '__northstar-layout-probe.svelte');
const investigatedCases = JSON.parse(await readFile(join(repository, 'qualification/layout-render-cases.json'), 'utf8')).cases.map((entry) => entry.componentId + ':' + entry.id);
const source = `
<script>
  import { createProjectTheme } from '@dkcli/tokens';
  import { COMPONENT_VERIFICATION_REGISTRY } from '/packages/components/src/lib/verification.ts';
  import Accordion from '/packages/components/src/lib/accordion/Accordion.svelte';
  import Badge from '/packages/components/src/lib/badge/Badge.svelte';
  import Breadcrumbs from '/packages/components/src/lib/breadcrumbs/Breadcrumbs.svelte';
  import Button from '/packages/components/src/lib/button/Button.svelte';
  import Checkbox from '/packages/components/src/lib/checkbox/Checkbox.svelte';
  import TextField from '/packages/components/src/lib/text-field/TextField.svelte';

  const theme = createProjectTheme({ name: 'Northstar', seed: { color: '#c44724', ratio: 'perfect-fourth', mode: 'light', density: 'comfortable', motion: 'snappy' }, fonts: { body: 'system-ui, sans-serif', display: 'Georgia, serif', mono: 'ui-monospace, monospace' } });
  const investigatedCases = ${JSON.stringify(investigatedCases)};
  const fixtures = COMPONENT_VERIFICATION_REGISTRY.flatMap((entry) => entry.createRegistration(theme).recipe.proofFixtures).filter((fixture) => investigatedCases.includes(fixture.componentId + ':' + fixture.id));
  window.__northstarFixtures = fixtures;
</script>

<main data-ready="true">
{#each fixtures as fixture}
  {#each fixture.layout[0].widths as width}
    <section data-fixture={fixture.id} data-component={fixture.componentId} data-width={width} style:width={width + 'px'}>
      {#if fixture.componentId === 'accordion'}
        <Accordion {theme} size={fixture.axes.size} value="sample" items={[{ value: 'sample', label: fixture.sampleText, content: fixture.sampleText }]} />
      {:else if fixture.componentId === 'badge'}
        <Badge {theme} {...fixture.axes}>{fixture.sampleText}</Badge>
      {:else if fixture.componentId === 'breadcrumbs'}
        <Breadcrumbs {theme} size={fixture.axes.size} items={[{ label: 'Workspace', href: '#workspace' }, { label: 'Release', href: '#release' }, { label: 'Production' }]} />
      {:else if fixture.componentId === 'button'}
        <Button {theme} size={fixture.axes.size} variant={fixture.axes.variant} {...fixture.props}>{fixture.sampleText}</Button>
      {:else if fixture.componentId === 'checkbox'}
        <Checkbox {theme} size={fixture.axes.size} label={fixture.sampleText} checked={fixture.states.includes('checked')} indeterminate={fixture.states.includes('indeterminate')} />
      {:else if fixture.componentId === 'text-field'}
        <TextField {theme} size={fixture.axes.size} label={fixture.sampleText} value={fixture.sampleText} />
      {/if}
    </section>
  {/each}
{/each}
</main>
<style>
  main { display: grid; gap: 1rem; font-family: system-ui, sans-serif; }
  section { min-inline-size: 0; }
</style>
`;

test('Northstar conservative layout samples retain complete content at their declared widths', async () => {
  const cache = await mkdtemp(join(tmpdir(), 'dk-northstar-layout-'));
  const server = await createServer({
    configFile: false,
    root: repository,
    cacheDir: cache,
    plugins: [{
      name: 'northstar-layout-probe',
      enforce: 'pre',
      resolveId(id) { if (id === 'virtual:northstar-layout.svelte') return harnessId; },
      load(id) { if (id === harnessId) return source; },
      configureServer(server) {
        server.middlewares.use('/northstar-layout', async (_request, response, next) => {
          try {
            const html = await server.transformIndexHtml('/northstar-layout', '<!doctype html><html><body><div id="app"></div><script type="module">import { mount } from "svelte"; import App from "virtual:northstar-layout.svelte"; mount(App, { target: document.getElementById("app") });</script></body></html>');
            response.setHeader('Content-Type', 'text/html');
            response.end(html);
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
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    page.setDefaultTimeout(15_000);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${address.port}/northstar-layout`);
    await page.locator('[data-ready=true]').waitFor();
    await page.evaluate(() => document.fonts.ready);
    const observations = [];
    for (const viewportWidth of [1440, 320]) {
      await page.setViewportSize({ width: viewportWidth, height: 960 });
      observations.push(...await page.locator('[data-fixture]').evaluateAll((rows, viewportWidth) => rows.map((row) => {
        const bounds = row.getBoundingClientRect();
        const candidates = [...row.querySelectorAll('*')].filter((element) => !element.matches('input,.sr-only') && getComputedStyle(element).position !== 'absolute');
        const nodes = candidates.map((element) => {
          const rect = element.getBoundingClientRect();
          const css = getComputedStyle(element);
          const directText = [...element.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
          const ranges = directText.flatMap((node) => { const range = document.createRange(); range.selectNodeContents(node); return [...range.getClientRects()].map((rect) => ({ left: rect.left, right: rect.right })); });
          return { selector: element.className || element.tagName, text: directText.map((node) => node.textContent).join('').trim(), left: rect.left, right: rect.right, width: rect.width, height: rect.height, clientWidth: element.clientWidth, scrollWidth: element.scrollWidth, fontSize: css.fontSize, ranges };
        });
        const input = row.querySelector('input:not([type=checkbox])');
        const inputBounds = input?.getBoundingClientRect();
        return { viewportWidth, component: row.dataset.component, fixtureId: row.dataset.fixture, width: Number(row.dataset.width), clientWidth: row.clientWidth, scrollWidth: row.scrollWidth, left: bounds.left, right: bounds.right, text: row.textContent.replace(/\\s+/g, ' ').trim(), input: input ? { value: input.value, clientWidth: input.clientWidth, scrollWidth: input.scrollWidth, width: inputBounds.width, height: inputBounds.height, fontSize: getComputedStyle(input).fontSize } : null, nodes };
      }), viewportWidth));
    }
    const failures = observations.flatMap((row) => row.nodes.filter((node) => node.scrollWidth > node.clientWidth + 1 || node.left < row.left - 1 || node.right > row.right + 1 || node.ranges.some((range) => range.left < row.left - 1 || range.right > row.right + 1)).map((node) => ({ component: row.component, fixtureId: row.fixtureId, viewportWidth: row.viewportWidth, containerWidth: row.width, node })));
    const fixtures = await page.evaluate(() => window.__northstarFixtures.map((fixture) => ({ component: fixture.componentId, id: fixture.id, sample: fixture.sampleText, layout: fixture.layout })));
    const receipt = { theme: 'Northstar', fonts: 'system-ui, sans-serif', fixtures, observations, failures, mapping: ['Accordion sample populates both trigger and panel; proof target panel uses trigger font token.', 'Breadcrumbs uses the three declared labels with delivered separators, not literal slash sample.', 'TextField sample populates both label and value; native value scrolling is recorded separately.'] };
    await writeFile('/tmp/dk-northstar-layout-observations.json', JSON.stringify(receipt, null, 2));
    assert.equal(fixtures.length, 17, 'The exact seventeen conservative fixture failures must be inspected.');
    assert.deepEqual(errors, [], 'The source sample render must have no browser errors.');
    for (const row of observations) {
      const fixture = fixtures.find((fixture) => fixture.component === row.component && fixture.id === row.fixtureId);
      assert.ok(fixture, 'Every rendered row must bind a declared fixture.');
      if (row.component === 'breadcrumbs') for (const segment of ['Workspace', 'Release', 'Production']) assert.ok(row.text.includes(segment), 'Complete Breadcrumb item labels must be retained.');
      else assert.ok(row.text.includes(fixture.sample), 'The complete declared sample must remain in the rendered row.');
      if (row.component === 'text-field') {
        assert.equal(row.input.value, fixture.sample, 'The modeled TextField input must retain the full sample value.');
        assert.ok(row.input.clientWidth > 0, 'Native input scrolling needs an actual allocated text viewport.');
      }
    }
    assert.deepEqual(failures, [], 'Complete source samples must fit their allocated rows without painted or native container overflow.');
  } finally {
    await browser?.close();
    await server.close();
    await rm(cache, { recursive: true, force: true });
  }
});
