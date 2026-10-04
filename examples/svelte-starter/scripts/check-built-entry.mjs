import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(path.join(root, 'dist/index.html'), 'utf8');
const dom = new JSDOM(html, { url: 'http://localhost/', runScripts: 'outside-only', pretendToBeVisual: true });

try {
  const document = dom.window.document;
  const script = document.querySelector('script[type="module"][src]');
  assert.ok(script, 'Built HTML must reference its browser entry');
  const entry = path.join(root, 'dist', script.getAttribute('src').replace(/^\//, ''));
  dom.window.eval(readFileSync(entry, 'utf8'));
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const settle = () => new Promise((resolve) => dom.window.setTimeout(resolve, 0));
  await settle();
  assert.equal(document.querySelector('h1')?.textContent, 'Plan a release');

  // Drive the built browser bundle, including its mount call and event wiring.
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const field = (name) => {
    const label = [...document.querySelectorAll('label')].find((element) => element.textContent.trim() === name);
    assert.ok(label, `Missing label ${name}`);
    const control = document.getElementById(label.htmlFor);
    assert.ok(control, `Label ${name} must target a control`);
    return control;
  };
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const button = (name, role) => {
    const element = [...document.querySelectorAll(role ? `[role="${role}"]` : 'button')].find((candidate) => candidate.textContent.trim() === name);
    assert.ok(element, `Missing ${role ?? 'button'} ${name}`);
    return element;
  };
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const type = (control, value) => {
    control.value = value;
    control.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  };

  const project = field('Project name');
  const owner = field('Release owner');
  assert.notEqual(project.id, owner.id);
  assert.equal(button('Save release').disabled, true);
  type(project, 'Atlas');
  type(owner, 'Casey');
  field('Environment').click();
  await settle();
  button('Production', 'option').click();
  await settle();
  const reviewer = field('Reviewer');
  reviewer.focus();
  await settle();
  assert.equal(document.activeElement, reviewer, 'Opening the search must preserve typing focus');
  button('Nina', 'option').click();
  await settle();
  const save = button('Save release');
  assert.equal(save.disabled, false);
  save.click();
  await settle();
  assert.equal(document.querySelector('[role="status"]').textContent, 'Saved Atlas.');
  assert.deepEqual([...document.querySelectorAll('dd')].map((element) => element.textContent), ['Atlas', 'Casey', 'Production', 'Nina']);
  assert.ok(document.head.querySelector('[data-designkit-theme="starter"]'));

  button('More actions').click();
  await settle();
  button('Clear form', 'menuitem').click();
  await settle();
  assert.equal(project.value, '');
  assert.equal(owner.value, '');
  assert.equal(reviewer.value, '');
  assert.equal(save.disabled, true);
  assert.equal(document.querySelector('[role="status"]').textContent, 'Form cleared.');
  console.log('Built starter entry passed: mount, labels, pointer selection, save, theme styles, and clear.');
} finally {
  dom.window.close();
}
