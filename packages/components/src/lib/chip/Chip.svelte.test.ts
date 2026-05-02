import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

import ChipHarness from './ChipHarness.svelte';

describe('Chip', () => {
  it('toggles selected state and reports the change', async () => {
    const onChange = vi.fn();

    render(ChipHarness, {
      props: {
        props: {
          label: 'Priority',
          onChange
        }
      }
    });

    const button = screen.getByRole('button', { name: /Priority/ });
    await fireEvent.click(button);

    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(onChange).toHaveBeenCalledWith({ selected: true });
  });

  it('renders a dismiss control when dismissible', async () => {
    const onDismiss = vi.fn();

    render(ChipHarness, {
      props: {
        props: {
          label: 'Filter',
          dismissible: true,
          onDismiss
        }
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: 'Dismiss Filter' }));
    expect(onDismiss).toHaveBeenCalled();
  });
});
