import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

import Stepper from './Stepper.svelte';

describe('Stepper', () => {
  it('navigates from the actually focused step and retains one tab stop', async () => {
    const onChange = vi.fn();
    render(Stepper, { props: { items: [{ id: 'plan', label: 'Plan' }, { id: 'build', label: 'Build' }, { id: 'ship', label: 'Ship' }], value: 'plan', onChange } });
    const tabs = screen.getAllByRole('tab');
    expect(tabs.filter((tab) => tab.tabIndex === 0)).toHaveLength(1);
    tabs[1].focus();
    await fireEvent.keyDown(tabs[1], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(tabs[2]);
    expect(onChange).toHaveBeenCalledExactlyOnceWith({ value: 'ship' });
  });

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
