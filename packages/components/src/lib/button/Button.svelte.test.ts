import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import { createTheme } from '@dkcli/tokens';

import Button from './Button.svelte';
import ButtonHarness from './ButtonHarness.svelte';

const theme = createTheme({
  name: 'button-test',
  seed: {
    color: '#295dff',
    ratio: 'perfect-fourth',
    mode: 'light',
    density: 'comfortable',
    motion: 'snappy'
  }
});

describe('Button', () => {
  it('renders as a button by default and as an anchor when href is provided', () => {
    const buttonRender = render(ButtonHarness, {
      props: { theme }
    });
    expect(buttonRender.container.querySelector('button')).toBeTruthy();

    const anchorRender = render(ButtonHarness, {
      props: { theme, href: '/docs', variant: 'link' }
    });
    expect(anchorRender.container.querySelector('a')?.getAttribute('href')).toBe('/docs');
  });

  it('drops unsafe href schemes before rendering anchor mode', () => {
    const { container } = render(ButtonHarness, {
      props: { theme, href: 'javascript:alert(1)', as: 'a', variant: 'link' }
    });

    expect(container.querySelector('a')?.hasAttribute('href')).toBe(false);
  });

  it('renders leading and trailing slots and preserves variant metadata', () => {
    const { container } = render(ButtonHarness, {
      props: { theme, variant: 'destructive', showLeading: true, showTrailing: true }
    });

    expect(screen.getByTestId('leading-slot')).toBeTruthy();
    expect(screen.getByTestId('trailing-slot')).toBeTruthy();
    expect(container.querySelector('.dk-button')?.getAttribute('data-variant')).toBe('destructive');
  });

  it('requires ariaLabel for icon-only buttons', () => {
    expect(() =>
      render(Button, {
        props: { theme, iconOnly: true }
      })
    ).toThrow(/ariaLabel/);
  });

  it('renders the icon slot when iconOnly is enabled', () => {
    const { container } = render(ButtonHarness, {
      props: { theme, iconOnly: true, ariaLabel: 'Settings', showIcon: true }
    });

    expect(screen.getByTestId('icon-slot')).toBeTruthy();
    expect(container.querySelector('.dk-button')?.getAttribute('aria-label')).toBe('Settings');
  });

  it('uses the spinner and suppresses disabled anchor navigation while loading', async () => {
    const { container } = render(ButtonHarness, {
      props: { theme, href: '/checkout', as: 'a', loading: true, showSpinner: true }
    });

    const anchor = container.querySelector('a');
    expect(anchor?.getAttribute('aria-disabled')).toBe('true');
    expect(anchor?.getAttribute('tabindex')).toBe('-1');
    expect(screen.getByTestId('spinner-slot')).toBeTruthy();

    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    await fireEvent(anchor!, event);
    expect(event.defaultPrevented).toBe(true);
  });
});
