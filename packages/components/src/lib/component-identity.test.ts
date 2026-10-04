/// <reference types="node" />

import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { cleanup, render } from '@testing-library/svelte';
import { flushSync, hydrate, unmount } from 'svelte';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import ComponentIdentityHarness from './test-utils/ComponentIdentityHarness.svelte';

const kinds = [
  'text-field', 'textarea', 'checkbox', 'switch', 'file-upload', 'date-picker',
  'range-date-picker', 'inline-edit', 'dialog', 'drawer', 'tooltip', 'tabs',
  'accordion', 'command-palette', 'radio-group', 'radio-group-shared-name', 'select', 'combobox'
];
const explicitIdKinds = ['text-field', 'textarea', 'checkbox', 'switch', 'file-upload', 'date-picker', 'range-date-picker', 'select', 'combobox'];

function idsWithin(root: ParentNode): string[] {
  return Array.from(root.querySelectorAll('[id]'), (element) => element.id);
}

function expectUniqueIds(root: ParentNode): void {
  const ids = idsWithin(root);
  expect(ids.length).toBeGreaterThan(0);
  expect(new Set(ids).size).toBe(ids.length);
}

function expectLinkedLabels(root: ParentNode): void {
  for (const label of root.querySelectorAll<HTMLLabelElement>('label[for]')) {
    const instance = label.closest('[data-instance]');
    expect(instance?.querySelector(`[id="${label.htmlFor}"]`)).toBeTruthy();
  }
  for (const element of root.querySelectorAll('[aria-describedby], [aria-labelledby], [aria-activedescendant], [aria-expanded="true"][aria-controls]')) {
    const references = [
      element.getAttribute('aria-describedby'),
      element.getAttribute('aria-labelledby'),
      element.getAttribute('aria-activedescendant'),
      element.getAttribute('aria-expanded') === 'true' ? element.getAttribute('aria-controls') : null
    ]
      .filter((value): value is string => value !== null)
      .flatMap((value) => value.split(/\s+/));
    for (const id of references) {
      expect(root.querySelector(`[id="${id}"]`)).toBeTruthy();
    }
  }
}

function expectLegacySlotContent(kind: string, root: ParentNode): void {
  const slots = kind === 'text-field' ? ['leading', 'trailing']
    : kind === 'dialog' || kind === 'drawer' ? ['trigger', 'body', 'footer'] : [];
  for (const slot of slots) {
    for (const instance of [1, 2]) {
      expect(root.querySelector(`[data-testid="${slot}-${instance}"]`)).toBeTruthy();
    }
  }
}

afterEach(() => cleanup());

describe('component instance identities', () => {
  it.each(kinds)('keeps %s instances and accessible labels distinct', (kind) => {
    render(ComponentIdentityHarness, { props: { kind } });
    flushSync();

    expectUniqueIds(document.body);
    expectLinkedLabels(document.body);
    expectLegacySlotContent(kind, document.body);
    if (kind === 'radio-group') {
      const radios = document.querySelectorAll<HTMLInputElement>('input[type="radio"]');
      expect(radios[0].name).not.toBe(radios[1].name);
    } else if (kind === 'radio-group-shared-name') {
      for (const radio of document.querySelectorAll<HTMLInputElement>('input[type="radio"]')) {
        expect(radio.name).toBe('shared-choice');
      }
    }
  });

  it.each(explicitIdKinds)('preserves caller-provided %s IDs and descriptions', (kind) => {
    const { container } = render(ComponentIdentityHarness, { props: { kind, explicitIds: true } });

    expect(container.querySelector(`[id="custom-${kind}-1"]`)).toBeTruthy();
    expect(container.querySelector(`[id="custom-${kind}-2"]`)).toBeTruthy();
    expectUniqueIds(container);
    expectLinkedLabels(container);
  });
});

describe('server rendering and hydration identities', () => {
  let rendered: Record<string, { first: string; second: string }>;

  beforeAll(async () => {
    const { stdout } = await promisify(execFile)(process.execPath, [
      path.resolve('packages/components/src/lib/test-utils/render-identities.mjs'),
      JSON.stringify(kinds)
    ], { maxBuffer: 4 * 1024 * 1024 });
    rendered = JSON.parse(stdout) as typeof rendered;
  });

  it.each(kinds)('renders %s repeatedly and hydrates without changing identities', async (kind) => {
    const { first, second } = rendered[kind];
    const target = document.createElement('div');
    target.innerHTML = first;
    document.body.append(target);

    try {
      expectUniqueIds(target);
      expectLinkedLabels(target);
      expectLegacySlotContent(kind, target);
      const serverIds = idsWithin(target);
      const repeated = document.createElement('div');
      repeated.innerHTML = second;
      expect(idsWithin(repeated)).toEqual(serverIds);
      const component = hydrate(ComponentIdentityHarness, { target, props: { kind } });
      try {
        flushSync();
        expect(idsWithin(document.body)).toEqual(serverIds);
        expectLinkedLabels(document.body);
        expectLegacySlotContent(kind, document.body);
      } finally {
        await unmount(component);
      }
    } finally {
      target.remove();
    }
  });
});
