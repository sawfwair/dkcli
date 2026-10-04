/// <reference types="node" />

import { readFileSync } from 'node:fs';
import { render, screen } from '@testing-library/svelte';
import { expect, it } from 'vitest';

import Combobox from './Combobox.svelte';

it('fits the available inline size including padding and anchors its icon without an application reset', () => {
  // Vitest does not load component styles, and jsdom does not perform layout.
  // Apply the component stylesheet to verify the CSS sizing contract; browser
  // smoke tests verify its actual geometry in the packed consumer app.
  const source = readFileSync('packages/components/src/lib/combobox/Combobox.svelte', 'utf8');
  const style = document.createElement('style');
  style.textContent = source.slice(source.indexOf('<style>') + 7, source.indexOf('</style>'));
  document.head.append(style);

  try {
    render(Combobox, { props: { label: 'Reviewer', items: [{ value: 'nina', label: 'Nina' }] } });
    const input = screen.getByRole('combobox', { name: 'Reviewer' });
    const trigger = input.parentElement!;
    const inputStyle = getComputedStyle(input);

    expect(inputStyle.inlineSize).toBe('100%');
    expect(inputStyle.boxSizing).toBe('border-box');
    expect(inputStyle.display).toBe('block');
    expect(inputStyle.minInlineSize).toBe('0px');
    expect(trigger.style.getPropertyValue('--dk-combobox-input-inline-padding')).toBeTruthy();
    expect(getComputedStyle(trigger.querySelector('.combobox-icon')!).position).toBe('absolute');
  } finally {
    style.remove();
  }
});
