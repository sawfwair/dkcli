import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

import Stepper from './Stepper.svelte';

describe('Stepper', () => {
  it('selects a clicked step and reports the change', async () => {
    const onChange = vi.fn();
    render(Stepper, {
      props: {
        items: [
          { id: 'plan', label: 'Plan' },
          { id: 'build', label: 'Build' }
        ],
        value: 'plan',
        onChange
      }
    });

    const build = screen.getByRole('tab', { name: /Build/i });
    await fireEvent.click(build);

    expect(build.getAttribute('aria-selected')).toBe('true');
    expect(onChange).toHaveBeenCalledWith({ value: 'build' });
  });
});
